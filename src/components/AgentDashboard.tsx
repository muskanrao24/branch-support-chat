import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

const AgentDashboard = () => {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);
  const [inputAgentId, setInputAgentId] = useState("");
  const db = firestore;

  useEffect(() => {
    if (!agentId) return;

    const q = query(collection(db, "queries"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedQueries = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const relevantQueries = fetchedQueries.filter(
        (query: any) => !query.assignedTo || query.assignedTo === agentId
      );

      setQueries(relevantQueries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, agentId]);

  const assignQuery = async (queryId: string) => {
    try {
      const queryRef = doc(db, "queries", queryId);
      await updateDoc(queryRef, { assignedTo: agentId });
      alert("Query assigned to you!");
    } catch (error) {
      console.error("Error assigning query:", error);
      alert("Failed to assign the query.");
    }
  };

  const handleAgentIdSubmit = () => {
    if (inputAgentId.trim() === "") {
      alert("Agent ID cannot be empty.");
      return;
    }
    setAgentId(inputAgentId);
    setShowModal(false);
  };

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center">
        <div className="bg-gray-800 text-white rounded-lg p-6 shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4 text-center">Enter Agent ID</h2>
          <input
            type="text"
            value={inputAgentId}
            onChange={(e) => setInputAgentId(e.target.value)}
            placeholder="Your Agent ID"
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAgentIdSubmit}
            className="w-full bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition duration-200"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return <p className="text-center text-gray-400">Loading queries...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto text-white bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-center">Agent Dashboard</h2>
      <ul className="space-y-4">
        {queries.map((query) => (
          <li
            key={query.id}
            className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow"
          >
            <span>{query.text}</span>
            {!query.assignedTo && (
              <button
                onClick={() => assignQuery(query.id)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
              >
                Assign to Me
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AgentDashboard;
