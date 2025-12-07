import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SubmitDialog({
    open,
    onOpenChange,
    task,
    file,
    setFile,
    onSubmit,
    submitting,
    canSubmit,
}) {
    if (!task) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                        {String(task.status || "").toLowerCase() === "rejected" ? "Resubmit" : "Submit"} <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Task</span>
                    </DialogTitle>
                </DialogHeader>
                <h3>Task Title: {task.title || "Not mentioned"}</h3>
                <div className="space-y-3 mt-2">
                    <Label>Description:</Label>
                    <Textarea
                        disabled
                        rows={7}
                        className="text-sm resize-none overflow-y-auto break-words break-all"
                        value={task.description}
                        style={{
                            resize: "none",
                            maxHeight: "10rem",
                            minHeight: "5rem",
                        }}
                    />
                    <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    {!canSubmit && (
                        <p className="text-xs text-red-500">Submission window closed. Late work is not allowed.</p>
                    )}
                    <div className="flex gap-2 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={onSubmit}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            disabled={submitting || !canSubmit}
                        >
                            {submitting ? "Submitting..." : String(task.status || "").toLowerCase() === "rejected" ? "Resubmit" : "Submit"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


