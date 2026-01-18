"use client";

import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { PostComposerModal } from "@/features/social/sections/PostComposerModal";

export const PostComposerPreview = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setOpen(true)}>
        Apri composer
      </Button>
      {open ? (
        <PostComposerModal
          open={open}
          loading={loading}
          positionAvailable
          positionLabel="Milano, ITA"
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
};
