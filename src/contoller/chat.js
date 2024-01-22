import { collection, getDocs, limit, query, addDoc, Timestamp, getDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";

export const getDocumentData = async (bookingId, userId) => {
    try {
        const collectionRef = collection(db, "users", userId, "booking", bookingId, "chat");

        // Create a query against the collection, limiting the number of items to 100
        const queryLimit = query(collectionRef, limit(100));

        const querySnapshot = await getDocs(queryLimit);

        if (!querySnapshot.empty) {
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });
            return { status: "success", chats: data };
        } else {
            console.log("No documents found in the collection.");
            return null;
        }
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
};

export const AddDocumentData = async (bookingId, userId, data) => {
    const newData = { ...data, userType: "client", timeStamp: Timestamp.now() }
    // console.log("newData: ", newData);
    try {
        const chatCollectionRef = collection(db, "users", userId, "booking", bookingId, "chat");

        const newChatDocRef = await addDoc(chatCollectionRef, newData);

        console.log("Document written with ID: ", newChatDocRef.id);
        return { status: "success" }
    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}

export const UpdateDocumentData = async (bookingId, userId, id, newArray) => {
    console.log("id: ", id);
    console.log("newArray: ", newArray);
    try {
        const chatDocRef = doc(db, "users", userId, "booking", bookingId, "chat", id);
        const chatDocSnapshot = await getDoc(chatDocRef);
        const chatDocData = chatDocSnapshot.data();

        const updatedOptions = newArray;
        chatDocData.options = updatedOptions;
        await updateDoc(chatDocRef, chatDocData);
        return { status: "success" }
    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}