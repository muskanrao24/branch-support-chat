"use client";

import React, { FormEvent, useEffect, useState } from "react";
import {
  MagnifyingGlass,
  Paperclip,
  Smiley,
  PlusCircle,
  SignOut,
  Tray,
} from "@phosphor-icons/react/dist/ssr";

import Message from "../components/Message";
import MessageCard from "../components/MessageCard";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { firestore } from "../api/configs/firebaseconfig";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import * as Accordion from "@radix-ui/react-accordion";
import { Archive, CaretDown, PaperPlaneTilt } from "@phosphor-icons/react";
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
  const [agentname, setName] = useState("");
  const [agentUUID, setUUID] = useState("");
  const router = useRouter();
  const [conversationMessages, setCoversationMessages] = useState([]);

  const [currentConversationId, setCurrentConversationId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [iscurrentArchived, setisCurrentArchived] = useState(false);

  // const dummy = useRef(<HTMLDivElement/>);
  // Remember to scroll this div into view on message send
  // if(dummy.current){dummy.current.scrollIntoView({behaviour:'smooth'})}

  // Get all conversations where there is no agent assigned
  const q = query(
    collection(firestore, "conversations"),
    where("agentuuid", "==", "")
  );
  const [messages] = useCollection(q);

  // Get all conversations where the agent is involved
  const q2 = query(
    collection(firestore, "conversations"),
    where("agentuuid", "==", agentUUID)
  );
  const [conversations] = useCollection(q2);

  const q3 = query(collection(firestore, "agents"));

  const [agentsCount] = useCollection(q3);

  const q4 = query(collection(firestore, "archivedConversations"));
  const [archivedChats] = useCollection(q4);

  useEffect(() => {
    if (!sessionStorage.getItem("UUID")) {
      redirect("/");
    }

    const name = sessionStorage.getItem("NAME");
    const uuid = sessionStorage.getItem("UUID");
    const role = sessionStorage.getItem("ROLE");

    if (role != "agent") {
      redirect("/support");
    }

    if (name && uuid) {
      setName(name);
      setUUID(uuid);
    }

    const unsubscribe = fetchConversation(
      setCoversationMessages,
      currentConversationId,
      iscurrentArchived
    );

    return () => unsubscribe();
  }, [currentConversationId]);

  const handleArchivedMessage = async (msg: any, senderuuid: string) => {
    // Set the current conversation to archived
    setisCurrentArchived(true);
    // Check if the agentID is present

    if (msg.agentuuid.length > 15) {
      setCurrentConversationId(msg.agentuuid + msg.senderuuid);
      setCurrentUsername(msg.username);
    } else {
      const chatref = collection(firestore, "archivedConversations");
      const q = query(chatref, where("senderuuid", "==", senderuuid));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        console.log(doc.id, "=>", doc.data());
        setCurrentConversationId(doc.id);
        setCurrentUsername(doc.data().username);
      });
      // handleChatTransition({senderid : msg.senderuuid})
    }
  };

  const handleChatTransition = (usermessage: any) => {
    setisCurrentArchived(false);
    setCurrentConversationId(usermessage.id);
    setCurrentUsername(usermessage.data().username);
  };

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
      senderuuid: agentUUID,
      timestamp: Date.now(),
    };

    try {
      const conversationRef = doc(
        firestore,
        "conversations",
        currentConversationId
      );

      await updateDoc(conversationRef, {
        messages: arrayUnion(newData),
        agentuuid: agentUUID,
      });
      setMessageData({ content: "" });
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    const data = {
      uuid: sessionStorage.getItem("UUID"),
      documentId: sessionStorage.getItem("DBID"),
    };

    const response = await fetch("/api/agentDestroy", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Error logging out");
    } else {
      sessionStorage.clear();
      router.push("/");
    }
  };

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
        internal={message["senderuuid"] == agentUUID}
      />
    ));

    return messageItems;
  });

  console.log({ messages: messages?.docs.map((msg) => msg) });

  return (
    <div className="grid grid-cols-4 h-full p-4 bg-[#e6f2ff] min-h-screen">
      <div
        id="leftPane"
        className="h-full flex flex-col justify-center col-span-1 overflow-hidden bg-[#f0f7ff] rounded-lg"
      >
        <div id="appName" className="p-4 flex mb-2">
          <svg
            fill="#1e40af"
            height={56}
            width={56}
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.07 8.82S9.803 1.079 5.145 1.097C2.006 1.109.78 4.124 3.055 4.802c0 0-2.698.973-2.698 2.697 0 1.725 4.274 3.54 10.713 1.32zm1.931 5.924s.904 7.791 5.558 7.991c3.136.135 4.503-2.82 2.262-3.604 0 0 2.74-.845 2.82-2.567.08-1.723-4.105-3.737-10.64-1.82zm-3.672-1.55s-7.532 2.19-6.952 6.813c.39 3.114 3.53 3.969 3.93 1.63 0 0 1.29 2.559 3.002 2.351 1.712-.208 3-4.67.02-10.794zm5.623-2.467s7.727-1.35 7.66-6.008c-.046-3.138-3.074-4.333-3.728-2.051 0 0-1-2.686-2.726-2.668-1.724.018-3.494 4.312-1.206 10.727z" />
          </svg>
        </div>
        <hr
          style={{ margin: "auto" }}
          className="opacity-50 p-1 w-10/12 border-blue-200"
        />

        <div
          id="conversations"
          className="flex flex-col mt-2 h-full items-center overflow-hidden"
        >
          <div id="Search Box" className="mb-4 w-10/12">
            <div
              className="flex items-center p-2 bg-[#d1e7ff] justify-start rounded-xl hover:bg-blue-200 transition-colors duration-300"
              id="SearchBox"
            >
              <MagnifyingGlass color="#1e40af" size={28} />
              <input
                type="text"
                className="bg-transparent ml-3 focus:border-0 focus:outline-0 text-blue-900 w-full"
                placeholder="Search Here"
              />
            </div>
          </div>
          <div className="w-10/12 h-full overflow-y-auto">
            {/* Unassigned Messsages */}
            <Accordion.Root type="single" collapsible>
              <Accordion.Item value="item-1">
                <Accordion.Trigger
                  className={[
                    styles.AccordionTrigger,
                    "flex flex-row",
                    "hover:bg-blue-200",
                    "rounded-xl",
                    "hover:cursor-pointer",
                    "py-4",
                    "w-full",
                    "items-center",
                    "text-blue-900",
                    "transition-colors",
                    "duration-300",
                  ].join(" ")}
                >
                  <Tray size={24} color="#1e40af" />
                  <span className="ml-3 mr-2 font-bold">
                    Unassigned Messages
                  </span>
                  <CaretDown
                    className={styles.AccordionChevron}
                    style={{ transition: "300ms" }}
                    aria-hidden
                    size={18}
                  ></CaretDown>
                </Accordion.Trigger>
                <Accordion.Content className={styles.AccordionContent}>
                  {messages &&
                    messages.docs.map((msg) => (
                      <div
                        key={msg.id}
                        className="hover:bg-blue-100 rounded-xl transition-colors duration-300"
                        onClick={() => handleChatTransition(msg)}
                      >
                        <MessageCard
                          assigned={false}
                          displayName={msg.data().username}
                          content={msg.data().messages[0]["content"]}
                        />
                      </div>
                    ))}
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>

            {/* Normal Conversations */}
            {conversations &&
              conversations.docs.map((msg) => (
                <div
                  key={msg.id}
                  className="hover:bg-blue-100 rounded-xl transition-colors duration-300"
                  onClick={() => {
                    handleChatTransition(msg);
                  }}
                >
                  <MessageCard
                    assigned={true}
                    displayName={msg.data().username}
                    content={msg.data().messages[0]["content"]}
                  />
                </div>
              ))}
            {/* Archived Conversations */}
            {/* <div className="justify-self-end">
              <Accordion.Root type="single" collapsible>
                <Accordion.Item value="item-1">
                  <Accordion.Trigger
                    className={[
                      styles.AccordionTrigger,
                      "flex flex-row",
                      "hover:bg-blue-200",
                      "rounded-xl",
                      "hover:cursor-pointer",
                      "py-4",
                      "w-full",
                      "items-center",
                      "text-blue-900",
                      "transition-colors",
                      "duration-300",
                    ].join(" ")}
                  >
                    <Archive size={24} color="#1e40af" />
                    <span className="ml-3 mr-2 font-bold text-blue-900">
                      Archived Conversations
                    </span>
                    <CaretDown
                      className={styles.AccordionChevron}
                      style={{ transition: "300ms" }}
                      aria-hidden
                      size={18}
                    ></CaretDown>
                  </Accordion.Trigger>
                  <Accordion.Content className={styles.AccordionContent}>
                    {archivedChats &&
                      archivedChats.docs.map((msg, index) => (
                        <div
                          key={index}
                          className="hover:bg-blue-100 rounded-xl transition-colors duration-300"
                          onClick={() => {
                            handleArchivedMessage(msg, msg.data().senderuuid);
                          }}
                        >
                          <MessageCard
                            assigned={true}
                            displayName={msg.data().username}
                            content={msg.data().messages[0]["content"]}
                          />
                        </div>
                      ))}
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </div> */}
          </div>
        </div>
        <hr
          style={{ margin: "auto" }}
          className="opacity-50 w-10/12 p-3 border-blue-200"
        />
        <div id="userDetails" className="flex flex-row p-4">
          <div className="mr-3">
            <Avatar userName={agentname} />
          </div>
          <div>
            <span className={["text-xl font-bold text-blue-900"].join("")}>
              {agentname}
            </span>
            <br />
            <div
              className="flex flex-row items-center hover:text-blue-600 hover:underline hover:cursor-pointer transition-all duration-300"
              onClick={logout}
            >
              <div className="mr-1">
                <SignOut size={22} color="#1e40af" />
              </div>
              <div>
                <span className="font-semibold opacity-70 text-blue-700">
                  Logout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="col-span-3 h-full p-3 bg-[#f0f7ff] rounded-md overflow-hidden grid grid-rows-[auto_auto_1fr] gap-4"
        id="rightPane"
      >
        <div id="TopPanel">
          <div id="contactInfo" className="grid grid-cols-3 items-center p-4">
            <div className="rounded-xl col-span-2 flex flex-row">
              <div className="mr-5">
                <Avatar userName={currentUsername} />
              </div>

              <div>
                <span className={["text-xl font-bold text-blue-900"].join("")}>
                  {currentUsername}
                </span>
                <br />
                <span className="font-semibold opacity-70 text-blue-700">
                  @more_sender_info
                </span>
              </div>
            </div>
            <div className="w-full h-full grid place-items-center">
              <div className="flex flex-row items-center gap-3">
                <div className={[styles.glow, "bg-blue-500"].join(" ")}></div>
                <span className="text-sm opacity-70 text-blue-800">
                  {agentsCount ? agentsCount.docs.length : 0} online
                </span>
              </div>
            </div>
          </div>
        </div>
        <hr
          style={{ margin: "auto" }}
          className="opacity-50 w-11/12 p-3 border-blue-200"
        />
        <div className="container px-9 grid grid-rows-[1fr_auto] overflow-y-auto">
          <div id="MessagesBody" className="flex flex-col overflow-y-auto">
            {conversationItems}
          </div>
          <div id="InputBox" className="w-11/12 " style={{ margin: "auto" }}>
            <div className="flex flex-row bg-[#d1e7ff] rounded-xl p-2">
              <PlusCircle
                color="#1e40af"
                size={28}
                className="hover:text-blue-600 transition-colors duration-300"
              />
              <form
                className="w-11/12 flex flex-row items-center"
                onSubmit={handleMessageSend}
              >
                <input
                  name="content"
                  type="text"
                  className="bg-transparent ml-3 focus:border-0 focus:outline-0 w-11/12 text-blue-900 placeholder-blue-700"
                  placeholder="Type your message"
                  onChange={handleInputChange}
                  value={messageData.content}
                />
                <button
                  className="ml-4 hover:scale-110 transition-transform duration-300"
                  type="submit"
                >
                  <PaperPlaneTilt
                    color="#1e40af"
                    weight="fill"
                    size={28}
                    className="hover:text-blue-600 transition-colors duration-300"
                  />
                </button>
              </form>

              <div className="flex flex-row">
                <Smiley
                  className="mr-3 hover:text-blue-600 transition-colors duration-300"
                  color="#1e40af"
                  size={28}
                />
                <Paperclip
                  color="#1e40af"
                  size={28}
                  className="hover:text-blue-600 transition-colors duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
