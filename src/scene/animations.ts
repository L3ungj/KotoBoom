import { AnimationAction, AnimationClip, AnimationMixer, KeyframeTrack, QuaternionKeyframeTrack, VectorKeyframeTrack, SkinnedMesh } from 'three'

export type AnimationName = 'idle' | 'walk'

type BoneName = 'center' | 'head' | 'arm_L' | 'arm_R' | 'shoulder_L' | 'shoulder_R' | 'hair1_L' | 'hair1_R' | 'hair2_L' | 'hair2_R' | 'hair3_L' | 'hair3_R' | 'leg_L' | 'leg_R'

interface BoneAnimation {
  boneName: BoneName
  tracks: {
    name: string
    times: number[]
    values: number[]
  }[]
  duration: number
}

interface AnimationDefinition {
  name: AnimationName
  duration: number
  boneAnimations: BoneAnimation[]
}

const ANIMATIONS: AnimationDefinition[] = [
  {
    name: 'idle',
    duration: 4,
    boneAnimations: [
    ]
  },
  {
    name: 'walk',
    duration: 1,
    boneAnimations: [
      oscAnim('leg_L', 1, 0.3, 0, 0),
      oscAnim('leg_R', 1, -0.3, 0, 0),
      oscAnim('shoulder_L', 1, -0.3, 0, 0),
      oscAnim('shoulder_R', 1, 0.3, 0, 0)
    ]
  }
]

export function getBone(mesh: SkinnedMesh, boneName: BoneName) {
  const IDX: Record<BoneName, number> = {
    center: 0,
    head: 4,
    shoulder_L: 6,
    arm_L: 7,
    shoulder_R: 11,
    arm_R: 12,
    hair1_L: 26,
    hair1_R: 27,
    hair2_L: 28,
    hair2_R: 29,
    hair3_L: 30,
    hair3_R: 31,
    leg_L: 18,
    leg_R: 22
  }
  return mesh.skeleton.bones[IDX[boneName]]
}

export function getActions(mesh: SkinnedMesh, mixer: AnimationMixer): Record<AnimationName, AnimationAction> {
  const actions = {} as Record<AnimationName, AnimationAction>
  ANIMATIONS.forEach((def) => {
    const tracks: KeyframeTrack[] = []
    def.boneAnimations.forEach((boneAnim) => {
      const targetBone = getBone(mesh, boneAnim.boneName)
      boneAnim.tracks.forEach((trackDef) => {
        let track: KeyframeTrack
        if(trackDef.name === 'quaternion') {
          track = new QuaternionKeyframeTrack(
            `${targetBone.name}.quaternion`,
            trackDef.times,
            trackDef.values
          )
        } else if (trackDef.name === 'translation') {
          track = new VectorKeyframeTrack(
            `${targetBone.name}.position`,
            trackDef.times,
            trackDef.values
          )
        } else {
          track = new KeyframeTrack(
            `${targetBone.name}.${trackDef.name}`,
            trackDef.times,
            trackDef.values
          )
        }
        tracks.push(track)
      })
    })
    const clip = new AnimationClip(def.name, def.duration, tracks)
    const action = mixer.clipAction(clip)

    actions[def.name] = action
  })
  return actions
}

function oscAnim(boneName: BoneName, period: number, x: number, y: number, z: number) {
  const times = [0, period / 4, period / 2, (3 * period) / 4, period]
  const realPart = Math.sqrt(1 - x * x - y * y - z * z)
  const values = [
    0, 0, 0, 1,
    x, y, z, realPart,
    0, 0, 0, 1,
    -x, -y, -z, realPart,
    0, 0, 0, 1
  ]
  return {
    boneName,
    duration: period,
    tracks: [{ name: 'quaternion', times, values }]
  }
}