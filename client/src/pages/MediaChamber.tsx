import { useMemo, useState } from "react";
import { Archive, FileAudio, FileImage, FileVideo, Loader2, Save, Search, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

function formatBytes(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindOf(contentType: string) {
  return contentType.startsWith("image/") ? "image" : contentType.startsWith("video/") ? "video" : "audio";
}

export default function MediaChamber() {
  const library = trpc.curator.mediaLibrary.useQuery();
  const upload = trpc.curator.uploadMedia.useMutation({ onSuccess: () => library.refetch() });
  const update = trpc.curator.updateMediaAsset.useMutation({ onSuccess: () => { library.refetch(); setSelectedId(null); } });
  const archive = trpc.curator.archiveMediaAsset.useMutation({ onSuccess: () => { library.refetch(); setSelectedId(null); } });
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ fileName: "", altText: "", caption: "", credit: "" });
  const assets = useMemo(() => (library.data || []).filter((asset) => (showArchived || !asset.archived) && [asset.fileName, asset.contentType, asset.altText, asset.caption].join(" ").toLowerCase().includes(query.toLowerCase())), [library.data, query, showArchived]);
  const selected = library.data?.find((asset) => asset.id === selectedId);
  const choose = (asset: NonNullable<typeof library.data>[number]) => { setSelectedId(asset.id); setForm({ fileName: asset.fileName, altText: asset.altText, caption: asset.caption, credit: asset.credit }); };
  const uploadFile = (file: File) => { const reader = new FileReader(); reader.onload = () => { const data = String(reader.result).split(",")[1]; if (data) upload.mutate({ fileName: file.name, contentType: file.type as "image/jpeg", data }); }; reader.readAsDataURL(file); };
  return <section className="media-library admin-form" aria-labelledby="media-library-heading">
    <div className="admin-list-head media-library-head"><div><p className="eyebrow oxblood">Managed assets</p><h2 id="media-library-heading">The Media Chamber.</h2><p className="admin-muted">One register for every image, video, and audio file uploaded through the curator desk. Usage is calculated from live content references.</p></div><span>{assets.length} visible assets</span></div>
    <div className="media-library-toolbar"><label className="media-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename, type, caption…" /></label><label className="media-upload-button"><Upload size={15} /> {upload.isPending ? "Uploading…" : "Upload asset"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,audio/webm" onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} disabled={upload.isPending} /></label><label className="media-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived</label></div>
    {upload.error && <p className="admin-error">{upload.error.message}</p>}{archive.error && <p className="admin-error">{archive.error.message}</p>}
    <div className="media-library-layout"><div className="media-asset-grid">{library.isLoading ? <p className="admin-muted">Opening the chamber…</p> : assets.length ? assets.map((asset) => <button type="button" className={`media-asset-card ${selectedId === asset.id ? "active" : ""} ${asset.archived ? "archived" : ""}`} key={asset.id} onClick={() => choose(asset)}><div className="media-asset-preview">{kindOf(asset.contentType) === "image" ? <img src={asset.url} alt={asset.altText || asset.fileName} /> : kindOf(asset.contentType) === "video" ? <video src={asset.url} muted preload="metadata" /> : <FileAudio size={30} />}</div><strong>{asset.fileName}</strong><span>{asset.contentType} · {formatBytes(asset.sizeBytes)}</span><small>{asset.usage.length ? `${asset.usage.length} use${asset.usage.length === 1 ? "" : "s"}` : "Unused"}{asset.archived ? " · archived" : ""}</small></button>) : <p className="admin-muted">No matching assets. Upload an image, video, or audio file to begin.</p>}</div>
    <aside className="media-asset-detail">{selected ? <><div className="media-detail-top"><div><p className="eyebrow oxblood">Asset detail</p><h3>{selected.fileName}</h3></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Close asset detail"><X size={16} /></button></div><div className="media-detail-preview">{kindOf(selected.contentType) === "image" ? <img src={selected.url} alt={selected.altText || selected.fileName} /> : kindOf(selected.contentType) === "video" ? <video controls src={selected.url} /> : <audio controls src={selected.url} />}</div><p className="media-asset-facts">{selected.contentType}<br />{formatBytes(selected.sizeBytes)}<br />Uploaded {new Date(selected.createdAt).toLocaleString()}</p><form className="admin-form media-metadata-form" onSubmit={(event) => { event.preventDefault(); update.mutate({ id: selected.id, ...form }); }}><label>Filename<input value={form.fileName} onChange={(event) => setForm({ ...form, fileName: event.target.value })} /></label><label>Alt text<input value={form.altText} onChange={(event) => setForm({ ...form, altText: event.target.value })} placeholder="Describe the image for residents" /></label><label>Caption<textarea rows={3} value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} /></label><label>Credit<input value={form.credit} onChange={(event) => setForm({ ...form, credit: event.target.value })} placeholder="Artist, source, or rights note" /></label><button className="admin-submit" type="submit" disabled={update.isPending}>{update.isPending ? <Loader2 className="spin" size={15} /> : <Save size={15} />} Save metadata</button></form><div className="media-usage"><p className="eyebrow oxblood">Live usage</p>{selected.usage.length ? selected.usage.map((item, index) => <div key={`${item.source}-${item.title}-${index}`}><strong>{item.source}</strong><span>{item.title}</span></div>) : <p className="admin-muted">No records currently reference this asset. It can be archived safely.</p>}</div>{!selected.archived && !selected.usage.length && <button className="button-outline media-archive-button" type="button" onClick={() => archive.mutate({ id: selected.id })} disabled={archive.isPending}><Archive size={15} /> Archive unused asset</button>}</> : <div className="media-detail-empty"><FileImage size={25} /><p>Select an asset to inspect its metadata, preview, and live usage.</p></div>}</aside></div>
  </section>;
}
