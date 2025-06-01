import {auth, db} from './config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import {User} from '@/types';

// Check if localStorage is available (for private browsing detection)
const isStorageAvailable = () => {
    try {
        const test = '__firebase_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('🔐 localStorage not available (private browsing?)', e);
        return false;
    }
};

// Helper function to convert Firestore timestamps to Date objects
const convertTimestampToDate = (data: any) => {
    const converted = { ...data };
    if (converted.createdAt && converted.createdAt.toDate) {
        converted.createdAt = converted.createdAt.toDate();
    }
    return converted;
};

export const registerUser = async (email: string, password: string, displayName: string) => {
    try {
        // Ensure persistence is set before authentication
        if (isStorageAvailable()) {
            await setPersistence(auth, browserLocalPersistence);
            console.log('🔐 Persistence set for registration');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user document in Firestore using serverTimestamp
        const userDoc = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDoc, {
            email,
            displayName,
            isAdmin: false,
            isApproved: false,
            createdAt: serverTimestamp() // Use Firestore server timestamp
        });

        // Notify admins about new registration using serverTimestamp
        const adminNotifRef = collection(db, 'adminNotifications');
        await setDoc(doc(adminNotifRef), {
            type: 'NEW_USER_REGISTRATION',
            userId: userCredential.user.uid,
            email,
            displayName,
            createdAt: serverTimestamp(), // Use Firestore server timestamp
            status: 'PENDING'
        });

        console.log('🔐 User registered successfully with persistence');
        return userCredential.user;
    } catch (error) {
        console.error('🔐 Registration error:', error);
        throw error;
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        // Ensure persistence is set before authentication
        if (isStorageAvailable()) {
            await setPersistence(auth, browserLocalPersistence);
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        const userData = convertTimestampToDate(userDoc.data()) as User;

        if (!userData.isApproved) {
            throw new Error('Your account is pending approval from admin');
        }
        return userCredential.user;
    } catch (error) {
        console.error('🔐 Login error:', error);
        throw error;
    }
};

export const approveUser = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isApproved: true
        });

        // Update notification status
        const notifQuery = query(
            collection(db, 'adminNotifications'),
            where('userId', '==', userId),
            where('status', '==', 'PENDING')
        );

        const notifDocs = await getDocs(notifQuery);
        notifDocs.forEach(async (document) => {
            await updateDoc(doc(db, 'adminNotifications', document.id), {
                status: 'APPROVED'
            });
        });
    } catch (error) {
        throw error;
    }
};

export const rejectUser = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isApproved: false
        });

        // Update notification status
        const notifQuery = query(
            collection(db, 'adminNotifications'),
            where('userId', '==', userId),
            where('status', '==', 'PENDING')
        );

        const notifDocs = await getDocs(notifQuery);
        notifDocs.forEach(async (document) => {
            await updateDoc(doc(db, 'adminNotifications', document.id), {
                status: 'REJECTED'
            });
        });
    } catch (error) {
        throw error;
    }
};