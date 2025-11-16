import { GoogleGenAI, Type } from "@google/genai";
import type {
    Bibles,
    CreativeBrief,
    Storyboard,
    StoryboardShot,
    VisualContinuityIssue,
    VisualContinuityReport,
} from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const guessMimeType = (url: string, fallback: string): string => {
    const lower = url.toLowerCase();
    if (lower.includes(".png")) return "image/png";
    if (lower.includes(".webp")) return "image/webp";
    if (lower.includes(".gif")) return "image/gif";
    if (lower.includes(".mp4")) return "video/mp4";
    if (lower.includes(".mov")) return "video/quicktime";
    if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
    return fallback;
};

const dataUrlToInline = (dataUrl: string) => {
    const [header, data] = dataUrl.split(",");
    const mimeType = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
    return { inlineData: { data, mimeType } };
};

const blobToInlineData = async (blob: Blob, fallbackMime: string) => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Failed to read asset blob"));
        reader.readAsDataURL(blob);
    });
    return {
        inlineData: {
            data: base64,
            mimeType: blob.type || fallbackMime,
        },
    };
};

const fetchAsInlineData = async (url: string, expectedMime: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch asset for visual QA: ${response.statusText}`);
    const blob = await response.blob();
    return blobToInlineData(blob, expectedMime);
};

const captureVideoFrame = async (url: string) => {
    if (typeof document === "undefined") {
        // Server-side fallback
        return fetchAsInlineData(url, guessMimeType(url, "video/mp4"));
    }

    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "auto";
        video.playsInline = true;
        video.muted = true;
        video.src = url;

        const handleError = () => reject(new Error("Unable to capture frame from video for visual QA."));

        video.addEventListener("error", handleError);

        const capture = () => {
            const canvas = document.createElement("canvas");
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                handleError();
                return;
            }

            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            resolve(dataUrlToInline(dataUrl));
        };

        video.addEventListener("loadeddata", () => {
            // Seek a short distance into the clip for a representative frame.
            const targetTime = Math.min(Math.max(video.duration * 0.05, 0.1), Math.max(video.duration - 0.1, 0.1));
            const safeTime = isFinite(targetTime) ? targetTime : 0.1;
            video.currentTime = safeTime;
        });

        video.addEventListener("seeked", capture, { once: true });
    });
};

const buildShotDescriptor = (shot: StoryboardShot, section: string) => {
    return [
        `Shot ${shot.id} (${section})`,
        `Subject: ${shot.subject}`,
        `Action: ${shot.action || "n/a"}`,
        `Characters: ${shot.character_refs.join(", ") || "n/a"}`,
        `Location: ${shot.location_ref}`,
        `Style: ${shot.cinematic_enhancements.lighting_style}, ${shot.cinematic_enhancements.camera_lens}`,
    ].join(" | ");
};

export const runVisualContinuityAudit = async (
    storyboard: Storyboard,
    bibles: Bibles,
    brief: CreativeBrief
): Promise<{ report: VisualContinuityReport; tokenUsage: number }> => {
    const ai = getAiClient();

    const shotsWithAssets = storyboard.scenes
        .flatMap(scene => scene.shots.map(shot => ({ shot, scene })))
        .filter(({ shot }) => Boolean(shot.clip_url || shot.preview_image_url && shot.preview_image_url !== "error"));

    // Favor final video clips; fall back to preview images.
    const assets = shotsWithAssets.map(({ shot, scene }) => ({
        shot,
        section: scene.section,
        url: shot.clip_url || shot.preview_image_url,
        assetType: shot.clip_url ? "video" as const : "image" as const,
    })).slice(0, 12); // Cap attachments to keep the prompt manageable.

    const parts: any[] = [
        {
            text: `You are the AI Visual QA agent. Review the attached generated visuals (images or captured video frames) against the storyboard sections. 
Focus: character appearance consistency, style/aesthetic consistency, continuity between neighboring shots, and overall visual coherence. 
For any mismatch, call out the exact storyboard section (e.g., verse_1, chorus_2) and the shot id. Keep recommendations concise and actionable.`,
        },
        {
            text: `Creative brief style: ${brief.style || "n/a"} | Feel: ${brief.feel || "n/a"} | Mood: ${brief.mood?.join(", ") || "n/a"} | Color palette: ${brief.color_palette?.join(", ") || "n/a"}`,
        },
        {
            text: `Key character looks: ${bibles.characters.map(c => `${c.name}: ${c.physical_appearance.gender_presentation}, ${c.physical_appearance.hair_style_and_color}, outfit ${c.costuming_and_props.outfit_style}`).join(" | ")}`,
        },
        {
            text: `Locations: ${bibles.locations.map(l => `${l.name}: ${l.setting_type}, ${l.atmosphere_and_environment.time_of_day}, palette ${l.cinematic_style.color_palette.join(",")}`).join(" | ")}`,
        },
    ];

    for (const asset of assets) {
        try {
            const inlinePart = asset.assetType === "video"
                ? await captureVideoFrame(asset.url)
                : asset.url.startsWith("data:")
                    ? dataUrlToInline(asset.url)
                    : await fetchAsInlineData(asset.url, guessMimeType(asset.url, "image/jpeg"));

            parts.push({
                text: `Asset for ${buildShotDescriptor(asset.shot, asset.section)} | Type: ${asset.assetType}`,
            });
            parts.push(inlinePart);
        } catch (err) {
            console.warn("Visual QA: skipping asset due to fetch/capture error", err);
        }
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [{ role: "user", parts }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    overallVerdict: { type: Type.STRING },
                    overallScore: { type: Type.NUMBER },
                    checklist: {
                        type: Type.OBJECT,
                        properties: {
                            characterConsistency: { type: Type.STRING },
                            styleConsistency: { type: Type.STRING },
                            continuity: { type: Type.STRING },
                            visualQuality: { type: Type.STRING },
                        },
                        required: ["characterConsistency", "styleConsistency", "continuity", "visualQuality"],
                    },
                    issues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                shotId: { type: Type.STRING },
                                sceneId: { type: Type.STRING },
                                section: { type: Type.STRING },
                                assetType: { type: Type.STRING },
                                assetUrl: { type: Type.STRING },
                                severity: { type: Type.STRING },
                                finding: { type: Type.STRING },
                                recommendation: { type: Type.STRING },
                            },
                            required: ["shotId", "section", "assetType", "severity", "finding", "recommendation"],
                        },
                    },
                },
                required: ["summary", "overallVerdict", "issues", "checklist"],
            },
        },
    });

    const report = JSON.parse(response.text) as VisualContinuityReport;

    // Enrich issues with missing section data if omitted.
    const sectionLookup = new Map<string, { section: string; sceneId: string }>();
    storyboard.scenes.forEach(scene => scene.shots.forEach(shot => sectionLookup.set(shot.id, { section: scene.section, sceneId: scene.id })));

    report.issues = (report.issues || []).map((issue: VisualContinuityIssue) => {
        const lookup = sectionLookup.get(issue.shotId);
        return {
            ...issue,
            section: issue.section || lookup?.section || "unknown",
            sceneId: issue.sceneId || lookup?.sceneId || "",
        };
    });

    return { report, tokenUsage: 900 };
};

