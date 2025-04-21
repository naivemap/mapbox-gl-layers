/* eslint-disable guard-for-in */
// @ts-nocheck
import TinyQueue from 'tinyqueue'
export default class Arrugator {
  constructor(projector, verts, uv, trigs) {
    // The projector function. Must be able to take
    // an array of two numbers [x,y] and return an array of
    // two numbers.
    // The typical use case is a proj4(from,to).forward function.
    this._projector = projector

    // A two-dimensional array of vertex coordinates. Each vertex is a
    // two-element [x,y] array.
    this._verts = verts

    // A two-dimensional array of UV-map coordinates. These are intended to
    // represent the [0,0]-[1-1] coordinate space of WebGL textures. Each
    // n-th element is the UV coordinates of the n-th vertex. These shall
    // be linearly interpolated when splitting segments.
    this._uv = uv

    // A two-dimensional array of vertex coordinates, projected. Each
    // vertex is a two-element [x,y] array.
    this._projVerts = verts.map(projector)

    // A two-dimensional array of triangle vertex IDs. Each triangle is a
    // three-element [v1,v2,v3] array.
    // The mesh is **expected** to be compact, planar, non-overlapping.
    this._trigs = trigs

    // A map of segments to vertices. Key is the segment index (generated inside
    // arrugator), value is an array of two vertex indices.
    this._segs = []

    this._segCount = 0

    // A map of segments to triangles. Key is the segment index (generated inside
    // arrugator), value is an array of triangle indices (all segments should
    // have either 1 or 2 triangles associated)
    this._segTrigs = []

    // A priority queue of segments, ordered by their epsilons, in descending order.
    this._queue = new TinyQueue([], function (a, b) {
      return b.epsilon - a.epsilon
    })

    // A map of vertex indices to segment indices.
    this._vertToSeg = new Array(verts.length)
    for (const i in this._verts) {
      this._vertToSeg[i] = []
    }
    /// NOTE: Not using .fill([]), because that would use a reference to the *same*
    /// empty array for every element.

    for (const t in this._trigs) {
      const trig = this._trigs[t]
      const v0 = trig[0]
      const v1 = trig[1]
      const v2 = trig[2]
      this._segment(v0, v1, t)
      this._segment(v1, v2, t)
      this._segment(v2, v0, t)
    }
  }

  // Returns the segment index linking the two given vertex indices;
  // Must be passed a triangle index to use as context.
  // Might create a new segment index (as well as segment data structure and
  // entry in the priority queue).
  _segment(v1, v2, t, maxEpsilon = Infinity) {
    if (this._vertToSeg[v1] && this._vertToSeg[v1][v2] !== undefined) {
      const found = this._vertToSeg[v1][v2]

      if (!this._segTrigs[found].includes(t)) {
        this._segTrigs[found].push(t)
      }

      return found
    }

    const segIdx = this._segCount++

    this._segs[segIdx] = [v1, v2]
    this._vertToSeg[v1][v2] = segIdx
    this._vertToSeg[v2][v1] = segIdx
    this._segTrigs[segIdx] = [t]

    // Calculate segment epsilon

    // The "epsilon" of a segment is the square of the midpoint projection distance:
    // i.e. the square of the distance between:
    //  - the projected midpoint of the two vertices, and
    //  - the midpoint of the two projected vertices,
    // the distance function being euclidean distance in the "destination"
    // projection, squared.

    const midpoint = [
      (this._verts[v1][0] + this._verts[v2][0]) / 2,
      (this._verts[v1][1] + this._verts[v2][1]) / 2,
    ]
    const projectedMid = this._projector(midpoint)
    const midProjected = [
      (this._projVerts[v1][0] + this._projVerts[v2][0]) / 2,
      (this._projVerts[v1][1] + this._projVerts[v2][1]) / 2,
    ]

    const epsilon =
      (projectedMid[0] - midProjected[0]) ** 2 + (projectedMid[1] - midProjected[1]) ** 2

    if (Number.isFinite(epsilon) && epsilon < maxEpsilon) {
      this._queue.push({
        v1: v1,
        v2: v2,
        epsilon: epsilon,
        midpoint: midpoint,
        projectedMid: projectedMid,
      })
    }

    return segIdx
  }

  // Outputs shallow copies of some data structures at the current step.
  output() {
    // Most data structs are 2-dimensional arrays, and doing a shallow copy
    // of the first level *should* just work.
    return {
      unprojected: Array.from(this._verts),
      projected: Array.from(this._projVerts),
      uv: Array.from(this._uv),
      trigs: Array.from(this._trigs),
    }
  }

  private _stepsWithSameEpsilon = 0

  // Subdivides the mesh until the maximum segment epsilon is below the
  // given threshold.
  // The `targetEpsilon` parameter must be in the same units as the
  // internal epsilons: units of the projected CRS, **squared**.
  lowerEpsilon(targetEpsilon) {
    let currentEpsilon = this._queue.peek().epsilon
    let lastEpsilon = currentEpsilon
    while (currentEpsilon >= targetEpsilon) {
      this.step()

      currentEpsilon = this._queue.peek().epsilon
      if (currentEpsilon === lastEpsilon) {
        this._stepsWithSameEpsilon++
        if (this._stepsWithSameEpsilon < 500) {
          console.warn(
            'Arrugator stopped due to epsilon stall. Raster may need hints for proper arrugation.'
          )
          break
        }
      } else {
        this._stepsWithSameEpsilon = 0
        lastEpsilon = currentEpsilon
      }
    }
  }

  get epsilon() {
    return this._queue.peek().epsilon
  }

  set epsilon(ep) {
    return this.lowerEpsilon(ep)
  }

  // Triggers subdivision of the segment with the largest epsilon.
  step() {
    const seg = this._queue.pop()
    return this._splitSegment(seg, seg.epsilon)
  }

  // Triggers *one* subdivision of *all* segments in the queue.
  // Can be useful to run this prior to stepping, in order to overcome
  // artefacts
  force() {
    const segments = this._queue.data
    this._queue.data = [] // Empties the queue
    this._queue.length = 0
    segments.forEach((seg) => this._splitSegment(seg, Infinity))
  }

  // Splits the given segment.
  // This deletes the segment, spawns a new vertex at the midpoint, and
  // for each triangle the segment was originally a part of (either 1 or 2),
  // the triangle is divided into two.
  private _splitSegment(seg, maxEpsilon) {
    // Which are the two vertices affected by the popped segment?
    const v1 = seg.v1
    const v2 = seg.v2
    const s = this._vertToSeg[v1] && this._vertToSeg[v1][v2]

    // Which triangle(s) are affected by the popped segment?
    const trigs = this._segTrigs[s]

    // Sanity check
    if (trigs.length >= 3) {
      throw new Error('Somehow a segment is shared by three triangles')
    }

    // Clean up refs
    delete this._segTrigs[s]
    delete this._segs[s]
    delete this._vertToSeg[v1][v2]
    delete this._vertToSeg[v2][v1]

    // What is the vertex ID of the new midpoint vertex?
    const vm = this._verts.length

    this._projVerts[vm] = seg.projectedMid
    this._verts[vm] = seg.midpoint
    this._vertToSeg[vm] = []
    this._uv[vm] = [
      (this._uv[v1][0] + this._uv[v2][0]) / 2,
      (this._uv[v1][1] + this._uv[v2][1]) / 2,
    ]

    for (const t of trigs) {
      this._splitTriangle(v1, v2, vm, t, maxEpsilon)
    }
  }

  // Split a triangle in two.
  // Must be given vertex indices of the segment being splitted, the index of the new
  // midpoint vertex, and the triangle index.
  // Shall silently drop any new segments with an epsilon larger than the
  // given one. This means that the segment shall be in the triangle mesh,
  // but will not be queued and therefore not subdivided ever.
  private _splitTriangle(v1, v2, vm, t, epsilon = Infinity) {
    const tvs = this._trigs[t]

    let v3
    let winding = false
    // Fetch the ID of the 3rd vertex in the original triangle, and the winding order
    if (tvs[0] === v1 && tvs[1] === v2) {
      v3 = tvs[2]
      winding = true // A-B-C
    } else if (tvs[1] === v1 && tvs[2] === v2) {
      v3 = tvs[0]
      winding = true // C-A-B
    } else if (tvs[2] === v1 && tvs[0] === v2) {
      v3 = tvs[1]
      winding = true // B-C-A
    } else if (tvs[1] === v1 && tvs[0] === v2) {
      v3 = tvs[2]
      winding = false // B-A-C
    } else if (tvs[2] === v1 && tvs[1] === v2) {
      v3 = tvs[0]
      winding = false // C-B-A
    } else if (tvs[0] === v1 && tvs[2] === v2) {
      v3 = tvs[1]
      winding = false // A-C-B
    } else {
      throw new Error('Data structure mishap: could not fetch 3rd vertex used in triangle')
    }

    // Index of the first "half" triangle will be the reused index of the original triangle
    // Index of the second "half" triangle must be allocated at the end of the triangles structure
    const t2 = this._trigs.length

    if (winding) {
      this._trigs[t] = [v1, vm, v3]
      this._trigs[t2] = [vm, v2, v3]
    } else {
      this._trigs[t] = [vm, v1, v3]
      this._trigs[t2] = [v2, vm, v3]
    }

    // Clean up references from old segments
    const s1 = this._vertToSeg[v1] && this._vertToSeg[v1][v2]
    const s2 = this._vertToSeg[v2] && this._vertToSeg[v2][v3]
    const s3 = this._vertToSeg[v3] && this._vertToSeg[v3][v1]

    function filterTrig(i) {
      return i !== t
    }

    if (s1 !== undefined) {
      this._segTrigs[s1] = this._segTrigs[s1].filter(filterTrig)
    }
    if (s2 !== undefined) {
      this._segTrigs[s2] = this._segTrigs[s2].filter(filterTrig)
    }
    if (s3 !== undefined) {
      this._segTrigs[s3] = this._segTrigs[s3].filter(filterTrig)
    }

    this._segment(v1, vm, t, epsilon)
    this._segment(vm, v3, t, epsilon)
    this._segment(v3, v1, t, epsilon)

    this._segment(v2, vm, t2, epsilon)
    this._segment(vm, v3, t2, epsilon)
    this._segment(v3, v2, t2, epsilon)
  }
}
