// firebase/auth.ts
import { auth, db } from './config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc
} from 'firebase/firestore';
import { User } from '@/types';

export const registerUser = async (email: string, password: string, displayName: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user document in Firestore
        const userDoc = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDoc, {
            email,
            displayName,
            isAdmin: false,
            isApproved: false,
            createdAt: new Date()
        });

        // Notify admins about new registration
        const adminNotifRef = collection(db, 'adminNotifications');
        await setDoc(doc(adminNotifRef), {
            type: 'NEW_USER_REGISTRATION',
            userId: userCredential.user.uid,
            email,
            displayName,
            createdAt: new Date(),
            status: 'PENDING'
        });

        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (!userDoc.exists()) {
            throw new Error('User document not found');
        }

        const userData = userDoc.data() as User;

        if (!userData.isApproved) {
            throw new Error('Your account is pending approval from admin');
        }

        return userCredential.user;
    } catch (error) {
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
