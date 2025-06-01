//
// import React, {createContext, useContext, useEffect, useState} from 'react';
// import {onAuthStateChanged} from 'firebase/auth';
// import {doc, getDoc} from 'firebase/firestore';
// import {User} from '@/types';
// import {auth, db} from "@/firebase/config";
//
// interface AuthContextType {
//     user: User | null;
//     loading: boolean;
// }
//
// const AuthContext = createContext<AuthContextType>({ user: null, loading: true });
//
// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//     const [user, setUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//
//     useEffect(() => {
//         return onAuthStateChanged(auth, async (firebaseUser) => {
//             if (firebaseUser) {
//                 const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
//                 if (userDoc.exists()) {
//                     setUser({id: userDoc.id, ...userDoc.data()} as User);
//                 }
//             } else {
//                 setUser(null);
//             }
//             setLoading(false);
//         });
//     }, []);
//
//     return (
//         <AuthContext.Provider value={{ user, loading }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };
//
// export const useAuth = () => useContext(AuthContext);

// app/services/AuthContext.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';
import {onAuthStateChanged} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import {User} from '@/types';
import {auth, db} from "@/firebase/config";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    persistenceReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    persistenceReady: false
});

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [persistenceReady] = useState(true);

    useEffect(() => {

        const initAuth = async () => {
            try {
                return onAuthStateChanged(auth, async (firebaseUser) => {

                    try {
                        if (firebaseUser) {
                            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                            if (userDoc.exists()) {
                                const userData = {id: userDoc.id, ...userDoc.data()} as User;
                                setUser(userData);
                            } else {
                                setUser(null);
                            }
                        } else {
                            setUser(null);
                        }
                    } catch (error) {
                        setUser(null);
                    }

                    setLoading(false);
                });
            } catch (error) {
                setLoading(false);
                return () => {
                };
            }
        };

        let unsubscribe: (() => void) | undefined;

        initAuth().then((unsub) => {
            unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{user, loading, persistenceReady}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);