# Talking avatar GLB files

Place a `.glb` 3D avatar here for the TalkingHead component. The model must have:

- **Mixamo-compatible rig** (skeleton)
- **ARKit + Oculus visemes** (blend shapes for lip-sync)

Use **`default.glb`** as the filename, or set `VITE_AVATAR_URL` in `.env` to your file path.

Sources for compatible avatars:

- [Avaturn](https://avaturn.me) (export GLB with visemes)
- [Mixamo](https://mixamo.com) characters + viseme blend shapes
- Custom models with the required rig and blend shapes (see [TalkingHead Appendix A](https://github.com/met4citizen/TalkingHead))

Ready Player Me is winding down (Jan 2026); prefer Avaturn or your own exports.
