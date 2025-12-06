import React, { useState, useRef, useEffect } from 'react';
import { Image, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePasteNoteProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  readOnly?: boolean;
}

const ImagePasteNote: React.FC<ImagePasteNoteProps> = ({ 
  images, 
  onImagesChange,
  readOnly = false 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste event
  useEffect(() => {
    if (readOnly) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            convertToBase64(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [images, readOnly, onImagesChange]);

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64 && !images.includes(base64)) {
        onImagesChange([...images, base64]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        convertToBase64(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  if (images.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div 
              key={index} 
              className="relative group rounded-xl overflow-hidden border border-border cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <img 
                src={img} 
                alt={`Image ${index + 1}`}
                className="w-full h-24 object-cover"
              />
              {!readOnly && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="absolute top-1 right-1 p-1 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Image Button */}
      {!readOnly && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all w-full"
          >
            <Image className="w-4 h-4" />
            <span>إضافة صورة (أو Ctrl+V)</span>
          </button>
        </>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePasteNote;
