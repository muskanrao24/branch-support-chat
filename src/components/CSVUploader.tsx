import { useState } from "react";
import { collection, doc, writeBatch } from "firebase/firestore";
import Papa from "papaparse";
import { firestore } from "@/lib/firebaseConfig";

const CSVUploader = () => {
  const [loading, setLoading] = useState(false);
  const db = firestore;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];
    setLoading(true);

    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        const queries = result.data;
        const batch = writeBatch(db);

        queries.forEach((query: any) => {
          const conversationRef = doc(collection(db, "conversations"));
          const newConversation = {
            agentuuid: "",
            senderuuid: query["User ID"],
            timestarted: query["Timestamp (UTC)"],
            username: query["User ID"],
            messages: [
              {
                content: query["Message Body"],
                senderuuid: query["User ID"],
                timestamp: query["Timestamp (UTC)"],
              },
            ],
          };

          batch.set(conversationRef, newConversation);
        });

        try {
          await batch.commit();
          alert("Queries uploaded successfully!");
        } catch (error) {
          console.error("Error uploading queries:", error);
          alert("Failed to upload queries.");
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        setLoading(false);
        alert("Error parsing the file.");
      },
    });
  };

  return (
    <div>
      <h2>Upload Customer Queries</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {loading && <p>Uploading...</p>}
    </div>
  );
};

export default CSVUploader;
