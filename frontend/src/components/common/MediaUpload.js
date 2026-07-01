// components/common/MediaUpload.js - FIXED VERSION
import React, { useState, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from './Button';
import { fileValidation } from '../../utils/validation';
import { createObjectURL, revokeObjectURL } from '../../utils/helpers';
import './MediaUpload.css';

const MediaUpload = ({
  onFileSelect,
  onRemove,
  onRemoveFile,
  maxSize = 500 * 1024 * 1024, // Increased to 500MB for videos
  label = 'Upload Media',
  acceptedTypes = 'image/*,video/*',
  existingMedia = null,
  helperText = '',
  multiple = false,
  disabled = false,
  maxFiles = 10
}) => {
  const { showToast } = useApp();
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState(existingMedia ? [existingMedia] : []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Video MIME type mapping
  const getVideoMimeType = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const mimeMap = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
      'm4v': 'video/x-m4v',
      'mpeg': 'video/mpeg',
      'mpg': 'video/mpeg',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv'
    };
    return mimeMap[extension] || 'video/mp4';
  };

  // Determine file type
  const getFileType = (url, file = null) => {
    // First try to use file object if available
    if (file) {
      if (file.type.startsWith('video/')) return 'video';
      if (file.type.startsWith('image/')) return 'image';
    }

    // Fallback to URL extension detection
    if (!url) return null;

    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpeg', '.mpg', '.wmv', '.flv'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];

    const extension = url.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || '';

    if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) return 'video';
    if (imageExtensions.some(ext => url.toLowerCase().includes(ext))) return 'image';

    // Check file name if available
    if (file && file.name) {
      const fileName = file.name.toLowerCase();
      if (videoExtensions.some(ext => fileName.endsWith(ext))) return 'video';
      if (imageExtensions.some(ext => fileName.endsWith(ext))) return 'image';
    }

    return null;
  };

  const handleFilesSelect = (files) => {
    const fileArray = Array.from(files);

    // Check if adding these files would exceed maxFiles
    if (multiple && selectedFiles.length + fileArray.length > maxFiles) {
      showToast(`Maximum ${maxFiles} files allowed`, 'error');
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      try {
        if (file.type.startsWith('image/')) {
          fileValidation.validateLogo(file);
        } else if (file.type.startsWith('video/')) {
          fileValidation.validatePostMedia(file);
        } else {
          // Try to determine type from extension
          const fileType = getFileType(null, file);
          if (fileType === 'image') {
            fileValidation.validateLogo(file);
          } else if (fileType === 'video') {
            fileValidation.validatePostMedia(file);
          } else {
            throw new Error('Unsupported file type. Please upload images or videos only.');
          }
        }
        validFiles.push(file);
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...validFiles] : [validFiles[0]];
      const newPreviewUrls = validFiles.map(file => createObjectURL(file));
      const allPreviewUrls = multiple ? [...previewUrls, ...newPreviewUrls] : newPreviewUrls;

      setSelectedFiles(newFiles);
      setPreviewUrls(allPreviewUrls);

      // Call onFileSelect with all files
      if (multiple) {
        onFileSelect(newFiles);
      } else {
        onFileSelect(newFiles[0]);
      }

      showToast(`${validFiles.length} file(s) selected successfully`, 'success');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleRemoveFile = (index) => {
    // Revoke object URL to prevent memory leaks
    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
      revokeObjectURL(previewUrls[index]);
    }

    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);

    if (multiple) {
      onFileSelect(newFiles);
      if (onRemoveFile) {
        onRemoveFile(index);
      }
    } else {
      onRemove();
    }

    showToast('File removed', 'info');
  };

  const handleRemoveAll = () => {
    // Revoke all object URLs
    previewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        revokeObjectURL(url);
      }
    });

    setPreviewUrls([]);
    setSelectedFiles([]);
    onRemove();
    showToast('All files removed', 'info');
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const renderPreview = (url, file, index) => {
    const fileType = getFileType(url, file);

    if (fileType === 'image') {
      return (
        <div key={index} className="media-upload__preview">
          <img
            src={url}
            alt={`Preview ${index + 1}`}
            className="media-upload__preview-image"
            onError={() => {
              showToast(`Failed to load image preview: ${file.name}`, 'error');
              handleRemoveFile(index);
            }}
          />
          <div className="media-upload__preview-overlay">
            <Button
              variant="outline"
              size="small"
              onClick={() => handleRemoveFile(index)}
              className="media-upload__remove-btn"
            >
              Remove
            </Button>
          </div>
          {multiple && (
            <div className="media-upload__file-info">
              <div className="media-upload__file-name">{file.name}</div>
              <div className="media-upload__file-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
              <div className="media-upload__file-type">Image</div>
            </div>
          )}
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div key={index} className="media-upload__preview">
          <video
            controls
            className="media-upload__preview-video"
            onError={() => {
              showToast(`Failed to load video preview: ${file.name}`, 'error');
              handleRemoveFile(index);
            }}
            preload="metadata"
          >
            <source src={url} type={getVideoMimeType(file.name)} />
            Your browser does not support the video tag.
          </video>
          <div className="media-upload__preview-overlay">
            <Button
              variant="outline"
              size="small"
              onClick={() => handleRemoveFile(index)}
              className="media-upload__remove-btn"
            >
              Remove
            </Button>
          </div>
          {multiple && (
            <div className="media-upload__file-info">
              <div className="media-upload__file-name">{file.name}</div>
              <div className="media-upload__file-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
              <div className="media-upload__file-type">Video</div>
            </div>
          )}
        </div>
      );
    }

    // Fallback for unknown file types
    return (
      <div key={index} className="media-upload__preview media-upload__preview--unknown">
        <div className="media-upload__unknown-file">
          <div className="media-upload__unknown-icon">📄</div>
          <div className="media-upload__unknown-name">{file.name}</div>
          <div className="media-upload__file-size">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>
        <div className="media-upload__preview-overlay">
          <Button
            variant="outline"
            size="small"
            onClick={() => handleRemoveFile(index)}
            className="media-upload__remove-btn"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  };

  const renderPreviews = () => {
    if (previewUrls.length === 0) return null;

    return (
      <div className="media-upload__previews">
        {multiple && (
          <div className="media-upload__previews-header">
            <span>{previewUrls.length} file(s) selected</span>
            <Button
              variant="outline"
              size="small"
              onClick={handleRemoveAll}
            >
              Remove All
            </Button>
          </div>
        )}
        <div className="media-upload__previews-grid">
          {previewUrls.map((url, index) =>
            renderPreview(url, selectedFiles[index], index)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="media-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="media-upload__input"
        multiple={multiple}
        disabled={disabled}
      />

      {previewUrls.length === 0 ? (
        <div
          className={`media-upload__dropzone ${isDragging ? 'media-upload__dropzone--dragging' : ''} ${disabled ? 'media-upload__dropzone--disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
        >
          <div className="media-upload__dropzone-content">
            <div className="media-upload__icon">📁</div>
            <div className="media-upload__text">
              <div className="media-upload__label">
                {multiple ? `${label} (Up to ${maxFiles})` : label}
              </div>
              <div className="media-upload__helper">
                {helperText || `Drag & drop or click to upload. Max size: ${maxSize / (1024 * 1024)}MB per file`}
                {multiple && ` • Max files: ${maxFiles}`}
                <div className="media-upload__formats">
                  <small>Supported: Images (JPG, PNG, GIF, WebP, BMP) • Videos (MP4, MOV, AVI, WebM, MKV, M4V)</small>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              disabled={disabled}
            >
              Choose File{multiple ? 's' : ''}
            </Button>
          </div>
        </div>
      ) : (
        renderPreviews()
      )}

      {!multiple && selectedFiles[0] && (
        <div className="media-upload__file-info">
          <div className="media-upload__file-name">{selectedFiles[0].name}</div>
          <div className="media-upload__file-size">
            {(selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="media-upload__file-type">
            {getFileType(null, selectedFiles[0]) === 'video' ? 'Video' : 'Image'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;