import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import getCroppedImg from '../../utils/getCroppedImg';
import '../../css/admin/CropModal.css';

function CropModal({ show, src, onSave, onCancel }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        const croppedImage = await getCroppedImg(src, croppedAreaPixels);
        onSave(croppedImage);
    };

    return (
        <Dialog open={show} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>画像をトリミング</DialogTitle>
            <DialogContent>
                <div className="crop-container">
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape="rect" // 正方形のクロップ領域
                        showGrid={false} // グリッドを非表示
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} variant="contained" color="secondary">キャンセル</Button>
                <Button onClick={handleSave} variant="contained" color="primary">完了</Button>
            </DialogActions>
        </Dialog>
    );
}

export default CropModal;
