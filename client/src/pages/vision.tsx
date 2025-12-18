import { useState, useRef } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useVisionBoard, useCreateVisionBoardItem, useUpdateVisionBoardItem, useDeleteVisionBoardItem } from "@/lib/api";
import { Plus, X, Image, Sparkles, Loader2, Upload, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function VisionPage() {
  const { data: items = [], isLoading } = useVisionBoard();
  const createItem = useCreateVisionBoardItem();
  const updateItem = useUpdateVisionBoardItem();
  const deleteItem = useDeleteVisionBoardItem();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemLabel, setDeleteItemLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setNewImageUrl(dataUrl);
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (!newImageUrl || !newLabel.trim()) return;

    createItem.mutate({ imageUrl: newImageUrl, label: newLabel.trim() }, {
      onSuccess: () => {
        toast({
          title: "Image added!",
          description: "Your vision board has been updated.",
        });
        setNewImageUrl("");
        setNewLabel("");
        setImagePreview(null);
        setShowAddDialog(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      onError: () => {
        toast({
          title: "Failed to add image",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleOpenDialog = () => {
    setNewImageUrl("");
    setNewLabel("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAddDialog(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setEditImageUrl(dataUrl);
        setEditImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (item: { id: string; imageUrl: string; label: string }) => {
    setEditItemId(item.id);
    setEditImageUrl(item.imageUrl);
    setEditLabel(item.label);
    setEditImagePreview(item.imageUrl);
    setShowEditDialog(true);
  };

  const handleEditItem = () => {
    if (!editItemId || !editLabel.trim()) return;

    updateItem.mutate({ id: editItemId, imageUrl: editImageUrl, label: editLabel.trim() }, {
      onSuccess: () => {
        toast({
          title: "Image updated!",
          description: "Your vision board has been updated.",
        });
        setShowEditDialog(false);
        setEditItemId(null);
        setEditImageUrl("");
        setEditLabel("");
        setEditImagePreview(null);
        if (editFileInputRef.current) {
          editFileInputRef.current.value = "";
        }
      },
      onError: () => {
        toast({
          title: "Failed to update",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteClick = (id: string, label: string) => {
    setDeleteItemId(id);
    setDeleteItemLabel(label);
  };

  const handleConfirmDelete = () => {
    if (deleteItemId) {
      deleteItem.mutate(deleteItemId, {
        onSuccess: () => {
          toast({
            title: "Image removed",
            description: "The image has been removed from your vision board.",
          });
          setDeleteItemId(null);
          setDeleteItemLabel("");
        },
        onError: () => {
          toast({
            title: "Failed to delete",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <MobileLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-primary to-secondary text-white px-5 pt-6 pb-5 rounded-b-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles size={18} className="text-white/80" />
              <h1 className="text-xl font-bold font-display">Vision Board</h1>
            </div>
            <p className="text-white/80 text-xs">Visualize your dreams and goals</p>
          </div>
        </div>

        <div className="px-4 pt-4 pb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40 min-h-[60vh]">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <Image size={48} className="opacity-40" />
                <p className="text-sm text-center">Your vision board is empty.<br/>Add images that inspire you!</p>
                <Button
                  onClick={handleOpenDialog}
                  className="mt-2"
                  data-testid="button-add-first-vision"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your First Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div 
                      key={item.id} 
                      className="relative group rounded-xl overflow-hidden shadow-sm border border-border/30"
                      data-testid={`vision-item-${item.id}`}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.label}
                        className="w-full aspect-square object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/e2e8f0/94a3b8?text=Image';
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">{item.label}</p>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                          aria-label={`Edit ${item.label}`}
                          data-testid={`button-edit-vision-${item.id}`}
                        >
                          <Pencil size={12} className="text-white" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id, item.label)}
                          className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                          aria-label={`Delete ${item.label}`}
                          data-testid={`button-delete-vision-${item.id}`}
                        >
                          <X size={14} className="text-white" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={handleOpenDialog}
                  variant="outline"
                  className="w-full"
                  data-testid="button-add-vision"
                >
                  <Plus size={18} className="mr-2" />
                  Add Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Add to Vision Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <div className="relative border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 active:bg-primary/5 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  data-testid="input-vision-file"
                />
                <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">Tap to change image</p>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Upload size={24} className="text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Tap to choose from photos
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="My dream vacation"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={100}
                data-testid="input-vision-label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddItem}
              disabled={!newImageUrl || !newLabel.trim() || createItem.isPending}
              data-testid="button-save-vision"
            >
              {createItem.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Board"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Edit Vision Board Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="relative border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 active:bg-primary/5 transition-colors">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  data-testid="input-edit-vision-file"
                />
                <div className="flex flex-col items-center justify-center gap-2 min-h-[120px]">
                  {editImagePreview ? (
                    <>
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">Tap to change image</p>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Upload size={24} className="text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Tap to choose from photos
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                placeholder="My dream vacation"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                maxLength={100}
                data-testid="input-edit-vision-label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleEditItem}
              disabled={!editLabel.trim() || updateItem.isPending}
              data-testid="button-update-vision"
            >
              {updateItem.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteItemLabel}" from your vision board? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={deleteItem.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
