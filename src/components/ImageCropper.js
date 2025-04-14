import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, Slider } from 'antd';
import getCroppedImg from '../utils/cropImage';

const ImageCropper = ({ image, onComplete, visible, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    onComplete(croppedImage);
  };

  return (
    <Modal open={visible} onCancel={onCancel} onOk={handleCropConfirm} title="Crop your image" width={400}>
      <div style={{ position: 'relative', height: 300, background: '#333' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <Slider
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={setZoom}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default ImageCropper;