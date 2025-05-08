import React, { useRef } from 'react';

const VideoPlayerLocal = ({ path }) => {
  const videoRef = useRef(null);
  return (
    <div className='iframe-container'>
      <video
          ref={videoRef}
          className="responsive-iframe"
          controls
          autoPlay
          loop
          muted>
        <source src={path} type="video/mp4" />
        Tu navegador no soporta la etiqueta de video.
      </video>
    </div>
  );
};

export default VideoPlayerLocal;