import { collection, getDocs, limit, query, addDoc, Timestamp, getDoc, updateDoc, doc, onSnapshot, orderBy, startAfter } from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
let lastDocument = null;


export const listenToDocumentData = (bookingId, userId, updateCallback) => {
    const collectionRef = collection(db, "users", userId, "booking", bookingId, "chat");
    const orderByDateDesc = orderBy("timeStamp", "desc");
    const queryLimit = query(collectionRef, orderByDateDesc, limit(50));

    getDocs(queryLimit).then((snapshot) => {
        let data = [];
        snapshot.forEach((doc) => {
            data.unshift({ ...doc.data(), id: doc.id }); // unshift to reverse the order
        });

        if (data.length > 0) {
            lastDocument = snapshot.docs[snapshot.docs.length - 1];
            const realTimeQuery = query(collectionRef, orderBy("timeStamp", "asc"), startAfter(lastDocument));

            const unsubscribe = onSnapshot(realTimeQuery, (querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    if (!data.some(d => d.id === doc.id)) {
                        data.push({ ...doc.data(), id: doc.id });
                    }
                });
                updateCallback({ status: "success", chats: data });
            }, (error) => {
                console.error("Error getting documents:", error);
            });

            return unsubscribe;
        } else {
            console.log("No documents found in the collection.");
            updateCallback({ status: "success", chats: data });
        }
    }).catch((error) => {
        console.error("Error getting documents:", error);
    });
};

export const loadMoreDocuments = (bookingId, userId, updateCallback) => {
    if (lastDocument) {
        const collectionRef = collection(db, "users", userId, "booking", bookingId, "chat");
        const orderByDateDesc = orderBy("timeStamp", "desc");
        const nextQuery = query(collectionRef, orderByDateDesc, startAfter(lastDocument), limit(50));

        getDocs(nextQuery).then((snapshot) => {
            let additionalData = [];
            snapshot.forEach((doc) => {
                additionalData.unshift({ ...doc.data(), id: doc.id });
            });

            if (additionalData.length > 0) {
                lastDocument = snapshot.docs[snapshot.docs.length - 1];
                updateCallback({ status: "success", chats: additionalData });
            } else {
                console.log("No more documents to load.");
            }
        }).catch((error) => {
            console.error("Error getting documents:", error);
        });
    } else {
        console.log("No starting point for loading more documents.");
    }
};

export const AddDocumentData = async (bookingId, userId, data) => {
    const newData = { ...data, userType: "client", timeStamp: Timestamp.now() }
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

export const UploadAttachment = async (bookingId, userId, data) => {
    console.log("data: ", data);
    const newData = { ...data, userType: "client", timeStamp: Timestamp.now() }
    console.log("newData: ", newData);
    try {
        const storageRef = ref(storage, `${userId}/${bookingId}/${data.name}`);
        const uploadResult = await uploadBytes(storageRef, data)
        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log("File available at", downloadURL);
        return { status: "success", url: downloadURL }
    } catch (error) {
        console.error("Error adding document:", error);
        throw error;
    }
}

