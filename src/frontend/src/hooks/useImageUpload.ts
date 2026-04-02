import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File): Promise<string | undefined> {
    setUploading(true);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await client.putFile(bytes);
      return hash;
    } catch {
      toast.error("Image upload failed");
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  const getImageUrl = useCallback(async (hash: string): Promise<string> => {
    const config = await loadConfig();
    const agent = new HttpAgent({ host: config.backend_host });
    const client = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    // Strip the Motoko deduplication sentinel prefix "!caf!" if present
    const SENTINEL = "!caf!";
    const cleanHash = hash.startsWith(SENTINEL)
      ? hash.slice(SENTINEL.length)
      : hash;
    return client.getDirectURL(cleanHash);
  }, []);

  return { uploadImage, getImageUrl, uploading };
}
