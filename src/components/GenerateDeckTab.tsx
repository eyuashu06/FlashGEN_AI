import React, { useState, useRef } from "react";
import { useFlashcards } from "../context/FlashcardContext";
import { Upload, Sparkles, FileText, XCircle, AlertCircle, CheckCircle } from "lucide-react";

export const GenerateDeckTab: React.FC<{ onDeckGenerated: (deckId: string) => void }> = ({
  onDeckGenerated,
}) => {
  const { generateAIDeck } = useFlashcards();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualText, setManualText] = useState("");
  const [cardCount, setCardCount] = useState(10);

  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; textContent: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Rotating loading messages
  const LOADING_MESSAGES = [
    "Analyzing document context...",
    "Scanning content for structural entities...",
    "Extracting atomic concepts and key formulas...",
    "Drafting active recall query-pairs with Gemini...",
    "Injecting initial SuperMemo spaced parameters...",
    "Polishing card fronts and backs into high-scannable formats...",
    "Structuring database indexes for instant recall..."
  ];

  // Client-side PDF Parsing script utilizing the browser CDN version
  const parsePdfClientSide = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            reject(
              new Error("PDF.js library was not loaded yet. Checking connection to CDN...")
            );
            return;
          }

          // Point to worker
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

          const loadingTask = pdfjsLib.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + " \n";
          }

          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.onerror = () => reject(new Error("File reading failed."));
      fileReader.readAsArrayBuffer(file);
    });
  };

  const processUploadedFile = async (file: File) => {
    setTitle(file.name.replace(/\.[^/.]+$/, "")); // Strip extension for title
    setErrorMessage("");
    setSuccessInfo("");

    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + " MB";

    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setIsLoading(true);
        setLoadingStep(0);
        const timer = setInterval(() => {
          setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
        }, 1500);

        const extractedText = await parsePdfClientSide(file);
        clearInterval(timer);
        setIsLoading(false);

        if (!extractedText.trim()) {
          throw new Error("No readable text found inside PDF. It might be scanned. Please copy paste text manually.");
        }

        setFileDetails({
          name: file.name,
          size: sizeStr,
          textContent: extractedText,
        });
        setSuccessInfo(`PDF scanned successfully! Extracted ${extractedText.split(/\s+/).length} words.`);
      } else if (
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".json")
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawText = e.target?.result as string;
          setFileDetails({
            name: file.name,
            size: sizeStr,
            textContent: rawText,
          });
          setSuccessInfo(`Text file loaded successfully! Read ${rawText.split(/\s+/).length} words.`);
        };
        reader.readAsText(file);
      } else {
        throw new Error("Unsupported file type. Please upload a standard PDF, TXT, MD, or JSON file.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not read this file.");
      setFileDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const triggerExtraction = async () => {
    const sourceContent = fileDetails ? fileDetails.textContent : manualText;

    if (!sourceContent.trim()) {
      setErrorMessage("Please enter manual content or upload a valid file source first.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setErrorMessage("");

    // Cycle through loading steps to show progression
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800);

    try {
      const generatedDeck = await generateAIDeck(
        title.trim() || fileDetails?.name || "AI Generated Study Deck",
        description.trim() || `Extracted automatically from ${fileDetails ? "uploaded document" : "manual text inputs"}.`,
        sourceContent,
        cardCount
      );

      clearInterval(interval);
      setIsLoading(false);
      onDeckGenerated(generatedDeck.deckId);
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      setErrorMessage(err.message || "Connection failure during Gemini deck generation.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-800">AI Study Deck Builder</h2>
        <p className="text-sm text-slate-500">
          Upload any lecture PDF, textbook chapters, or paste text to generate optimized active-recall study cards powered by Google AI.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs flex flex-col justify-center items-center min-h-[350px]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
          </div>

          <p className="text-lg font-bold text-slate-800 transition-all">
            {LOADING_MESSAGES[loadingStep]}
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            This utilizes Google Gemini on our secure server proxies to generate pristine atomic card decks. Please keep this screen open.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Panel */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-md font-bold text-slate-800">1. Select Material Source</h3>
              <p className="text-xs text-slate-500">Drag & drop your files securely. All data is processed on-the-fly and parsed locally.</p>
            </div>

            {/* Drag Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.txt,.md,.json"
                className="hidden"
              />

              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {fileDetails ? `Selected: ${fileDetails.name}` : "Upload a PDF, TXT or MD File"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports study notes, outlines, textbook chapters up to 25MB
                </p>
              </div>
            </div>

            {/* Manual text backup */}
            {!fileDetails && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    -- OR --
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Paste Lectures/Text Notes</span>
                </div>
                <textarea
                  placeholder="Paste your raw notes, concepts, study lists, or lecture context transcripts here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>
            )}

            {/* Error & Success indicators */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Generation Failed: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successInfo && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Extraction Successful: </span>
                  {successInfo}
                </div>
              </div>
            )}
          </div>

          {/* Settings & Submission panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
            <h3 className="text-md font-bold text-slate-800">2. Deck Customization</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Biochemistry Lecture 4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description / Study Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g., Focus on protein synthesis and ribosome structures"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>Number of Flashcards to extract</span>
                  <span className="text-indigo-600 font-extrabold">{cardCount} cards</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  value={cardCount}
                  onChange={(e) => setCardCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
                  <span>5 (Fast)</span>
                  <span>15 (Standard)</span>
                  <span>25 (Dense)</span>
                </div>
              </div>
            </div>

            <button
              onClick={triggerExtraction}
              disabled={!(fileDetails || manualText.trim()) || isLoading}
              className={`w-full py-3.5 px-4 font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !(fileDetails || manualText.trim()) || isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              Generate Study Deck with Gemini
            </button>

            {fileDetails && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>File attached: {fileDetails.name}</span>
                <button
                  onClick={() => {
                    setFileDetails(null);
                    setTitle("");
                    setSuccessInfo("");
                  }}
                  className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Clear File
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
