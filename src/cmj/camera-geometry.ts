/** Let the camera/browser provide an upright native frame. Portrait width/height
 * constraints can crop the sensor in the opposite orientation on mobile WebKit.
 * Bound inference resolution downstream, not by cropping camera capture. */
export function cameraConstraints(supported: MediaTrackSupportedConstraints & { resizeMode?: boolean } = {}): MediaStreamConstraints {
  return { audio: false, video: {
    facingMode: { ideal: 'environment' }, frameRate: { ideal: 60 },
    ...(supported.resizeMode ? { resizeMode: 'none' } : {}),
  } };
}

export function cameraDimensions(video: Pick<HTMLVideoElement, 'videoWidth' | 'videoHeight'>): { w: number; h: number } | null {
  return video.videoWidth > 0 && video.videoHeight > 0 ? { w: video.videoWidth, h: video.videoHeight } : null;
}
