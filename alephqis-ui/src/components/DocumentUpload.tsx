import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Upload, FileText, Check, X } from 'lucide-react';
import { clientApi } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: number;
}

interface DocumentUploadProps {
  documents: Document[];
  onDocumentUploaded: () => void;
}

const REQUIRED_DOCUMENTS = [
  { value: 'identity', label: 'Identity Document (Passport/ID)' },
  { value: 'address', label: 'Proof of Address' },
  { value: 'bank', label: 'Bank Statement' },
];

export function DocumentUpload({ documents, onDocumentUploaded }: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      toast.error('Please select both document type and file');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > maxSize) {
      toast.error(`File is too large. Maximum size is 5MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Please log in again');
      return;
    }

    setIsUploading(true);
    try {
      await clientApi.uploadDocument(token, selectedFile, selectedType);
      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setSelectedType('');
      onDocumentUploaded();
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.message && error.message.includes('too large')) {
        toast.error('File is too large. Maximum size is 5MB.');
      } else {
        toast.error(error.message || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentStatus = (type: string) => {
    return documents.some(doc => doc.type === type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6 bg-white border-border">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          Upload Documents
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <SelectItem key={doc.value} value={doc.value}>
                    {doc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="file-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : 'Choose a file...'}
                </span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </label>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !selectedType || isUploading}
                className="bg-foreground hover:bg-foreground/90"
              >
                <span className="gradient-blue-purple inline-flex items-center">
                  {isUploading ? 'Uploading...' : 'Upload'}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </p>
            {selectedFile && selectedFile.size > 5 * 1024 * 1024 && (
              <p className="text-xs text-red-600 mt-1">
                Warning: File is too large ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum is 5MB.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Document Status */}
      <Card className="p-6 bg-white border-border">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          Document Status
        </h3>

        <div className="space-y-3">
          {REQUIRED_DOCUMENTS.map((docType) => {
            const isUploaded = getDocumentStatus(docType.value);
            const doc = documents.find(d => d.type === docType.value);

            return (
              <div
                key={docType.value}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isUploaded ? 'border-green-200 bg-green-50' : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isUploaded ? 'bg-green-100' : 'bg-muted'
                  }`}>
                    {isUploaded ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {docType.label}
                    </p>
                    {doc && (
                      <p className="text-xs text-muted-foreground">
                        {doc.name} • {formatFileSize(doc.size)}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  isUploaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isUploaded ? 'Uploaded' : 'Required'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card className="p-6 bg-white border-border">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            Uploaded Documents
          </h3>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {REQUIRED_DOCUMENTS.find(d => d.value === doc.type)?.label} • {formatFileSize(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
