"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Paperclip, Smiley, PlusCircle } from "@phosphor-icons/react/dist/ssr";

import Message from "../components/Message";
import { redirect } from "next/navigation";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firestore } from "../api/configs/firebaseconfig";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import styles from "./styles.module.css";
import Avatar from "../components/Avatar";

const fetchConversation = (
  setConversationMessages: any,
  currentconversationId: any,
  iscurrentArchived: boolean
) => {
  let conversationMessageRef;

  if (iscurrentArchived) {
    conversationMessageRef = collection(firestore, "archivedConversations");
  } else {
    conversationMessageRef = collection(firestore, "conversations");
  }

  console.log(iscurrentArchived);

  // currentconversationId
  const q = query(conversationMessageRef);

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messagesArray: any = [];
    querySnapshot.forEach((doc) => {
      if (doc.id == currentconversationId) {
        messagesArray.push({ ...doc.data(), id: doc.id });
      }
    });
    setConversationMessages(messagesArray);
  });
  return unsubscribe;
};

function Page() {
  const [username, setUsername] = useState("");
  const [userUUID, setUUID] = useState("");
  const [conversationMessages, setConversationMessages] = useState([]);

  const [currentConversationId, setCurrentConversationId] = useState("");
  const [currentAgentName, setCurrentAgentName] = useState("");
  const [currentAgentUUID, setCurrentAgentUUID] = useState("");

  const q3 = query(collection(firestore, "agents"));
  const [agentsCount] = useCollectionData(q3);

  console.log({ conversationMessages });

  // Add a subscription to the current conversation
  useEffect(() => {
    if (!currentConversationId) {
      return;
    }
    const unsubscribe = fetchConversation(
      setConversationMessages,
      currentConversationId,
      false
    );
    return () => {
      unsubscribe();
    };
  }, [currentConversationId]);

  useEffect(() => {
    if (!currentConversationId) {
      return;
    }
    const q = query(
      collection(firestore, "conversations"),
      where("id", "==", currentConversationId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        setCurrentAgentUUID(data["agentuuid"]);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [currentConversationId]);

  useEffect(() => {
    if (!currentAgentUUID) {
      return;
    }
    const q = query(
      collection(firestore, "agents"),
      where("uuid", "==", currentAgentUUID)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(data);
        setCurrentAgentName(data["username"]);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [currentAgentUUID]);

  useEffect(() => {
    if (!sessionStorage.getItem("UUID")) {
      redirect("/");
    }

    const name = sessionStorage.getItem("NAME");
    const uuid = sessionStorage.getItem("UUID");

    if (name && uuid) {
      setUsername(name);
      setUUID(uuid);
    }

    // Logout when refreshing
    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }, []);

  const [messageData, setMessageData] = useState({
    content: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const { name, value } = event.target;
    setMessageData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleMessageSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newData = {
      content: messageData.content,
      senderuuid: userUUID,
      timestamp: Date.now(),
    };

    try {
      if (!currentConversationId) {
        // create a new conversation and add it to the conversations collection
        const conversationRef = collection(firestore, "conversations");
        const newConversation = {
          agentuuid: "",
          senderuuid: userUUID,
          timestarted: Date.now(),
          username: username,
          messages: [newData],
        };

        const docRef = await addDoc(conversationRef, newConversation);

        // update the current conversation id
        setCurrentConversationId(docRef.id);
        setMessageData({ content: "" });
      } else {
        const conversationRef = doc(
          firestore,
          "conversations",
          currentConversationId
        );

        await updateDoc(conversationRef, { messages: arrayUnion(newData) });
        setMessageData({ content: "" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!currentConversationId) {
      return;
    }
    // Move conversation to archive
    const archiveConversation = async () => {
      const conversationRef = doc(
        firestore,
        "conversations",
        currentConversationId
      );

      const archiveRef = collection(firestore, "archivedConversations");

      const conversationData = await getDoc(conversationRef);
      const data = conversationData.data();

      await addDoc(archiveRef, data);
      await deleteDoc(conversationRef);
    };

    // On close, archive the conversation
    window.addEventListener("beforeunload", archiveConversation);

    return () => {
      window.removeEventListener("beforeunload", archiveConversation);
    };
  }, []);

  // const exportConversation = async () => {
  //   let data = {
  //     agentid: userUUID,
  //   };
  //   const response = await fetch("/api/exportConversation", {
  //     method: "POST",
  //     body: JSON.stringify(data),
  //   });

  //   if (response.ok) {
  //     return;
  //   }
  //   console.error("Error Exporting Conversations: ");
  // };

  const conversationItems = conversationMessages.map((convo) => {
    const messagesArray = convo["messages"] as Chat[];

    type Chat = {
      content: string;
      internal: boolean;
      senderuuid: string;
      timestamp: string;
    };

    const messageItems = messagesArray.map((message, messageIndex) => (
      <Message
        key={messageIndex}
        content={message["content"]}
        time={new Date(parseInt(message["timestamp"]) * 1000).toTimeString()}
        internal={message["senderuuid"] == userUUID}
      />
    ));

    return messageItems;
  });

  return (
    <div className="grid grid-cols-4 h-full p-4 bg-[#e7f3ff] min-h-screen">
      <div
        className="col-span-4 h-full p-3 bg-[#ffffff] rounded-md overflow-hidden grid grid-rows-[auto_auto_1fr] gap-4 shadow-lg"
        id="rightPane"
      >
        <div id="TopPanel">
          <div id="contactInfo" className="grid grid-cols-3 items-center p-4">
            <div className="rounded-xl col-span-2 flex flex-row">
              {currentAgentName ? (
                <>
                  <div className="mr-5">
                    <Avatar userName={currentAgentName} />
                  </div>
                  <div>
                    <span
                      className={["text-xl font-bold text-[#2b2d31]"].join("")}
                    >
                      {currentAgentName}
                    </span>
                    <br />
                  </div>
                </>
              ) : (
                <span className={["text-xl font-bold text-[#2b2d31]"].join("")}>
                  {(conversationMessages[0] as any)?.messages?.length > 1
                    ? "Connected to an agent!"
                    : "Waiting for an agent..."}
                </span>
              )}
            </div>
            <div className="w-full h-full grid place-items-center">
              <div className="flex flex-row items-center gap-3">
                <div className={[styles.glow].join(" ")}></div>
                <span className="text-sm opacity-50 font text-[#2b2d31]">
                  {agentsCount?.length} online
                </span>
              </div>
            </div>
          </div>
        </div>
        <hr style={{ margin: "auto" }} className="opacity-50 w-11/12 p-3" />
        <div className="container px-9 grid grid-rows-[1fr_auto] overflow-y-auto">
          <div id="MessagesBody" className="flex flex-col overflow-y-auto">
            {conversationItems}
          </div>
          <div id="InputBox" className="w-full" style={{ margin: "auto" }}>
            <div className="flex flex-row bg-[#f0f4ff] rounded-xl p-2">
              <PlusCircle color="#5f6caf" size={28} />
              <form
                className="w-11/12 flex flex-row items-center"
                onSubmit={handleMessageSend}
              >
                <input
                  name="content"
                  type="text"
                  className="bg-transparent ml-3 focus:border-0 focus:outline-0 w-11/12 text-[#2b2d31]"
                  placeholder="Type your message"
                  onChange={handleInputChange}
                  value={messageData.content}
                />
                <button className="ml-4" type="submit">
                  <PaperPlaneTilt
                    className=""
                    color="#5f6caf"
                    weight="fill"
                    size={28}
                  />
                </button>
              </form>

              <div className="flex flex-row">
                <Smiley className="mr-3" color="#5f6caf" size={28} />
                <Paperclip color="#5f6caf" size={28} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
