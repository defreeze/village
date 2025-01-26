import * as Notifications from 'expo-notifications';
import { getFirestore, doc, getDoc, collection, query, where, orderBy, onSnapshot, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CLEAR_DATA, USERS_DATA_STATE_CHANGE, USERS_LIKES_STATE_CHANGE, USERS_POSTS_STATE_CHANGE, USER_CHATS_STATE_CHANGE, USER_FOLLOWING_STATE_CHANGE, USER_POSTS_STATE_CHANGE, USER_STATE_CHANGE } from '../constants/index';
//import { Constants } from 'react-native-unimodules';
import Constants from 'expo-constants';

let unsubscribe = [];

export function clearData() {
    return (dispatch) => {
        unsubscribe.forEach((unsub) => unsub());
        unsubscribe = [];
        dispatch({ type: CLEAR_DATA });
    };
}

export function reload() {
    return (dispatch) => {
        dispatch(clearData());
        dispatch(fetchUser());
        dispatch(setNotificationService());
        dispatch(fetchUserPosts());
        dispatch(fetchUserFollowing());
        dispatch(fetchUserChats());
    };
}

export const setNotificationService = () => async (dispatch) => {
    let token;
    if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
        alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });

    if (token) {
        const auth = getAuth();
        const firestore = getFirestore();
        const userDoc = doc(firestore, 'users', auth.currentUser.uid);
        await updateDoc(userDoc, { notificationToken: token });
    }
};

export const sendNotification = (to, title, body, data) => async () => {
    if (!to) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to,
            sound: 'default',
            title,
            body,
            data,
        }),
    });
};

export function fetchUser() {
    return (dispatch) => {
        const firestore = getFirestore();
        const auth = getAuth();

        const userDoc = doc(firestore, 'users', auth.currentUser.uid);
        const unsubscribeUser = onSnapshot(userDoc, (snapshot) => {
            if (snapshot.exists()) {
                dispatch({
                    type: USER_STATE_CHANGE,
                    currentUser: { uid: auth.currentUser.uid, ...snapshot.data() },
                });
            }
        });
        unsubscribe.push(unsubscribeUser);
    };
}

export function fetchUserChats() {
    return (dispatch) => {
        const firestore = getFirestore();
        const auth = getAuth();

        const chatsQuery = query(
            collection(firestore, 'chats'),
            where('users', 'array-contains', auth.currentUser.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
            const chats = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            chats.forEach((chat) => {
                const otherUserId = chat.users.find((uid) => uid !== auth.currentUser.uid);
                dispatch(fetchUsersData(otherUserId, false));
            });

            dispatch({ type: USER_CHATS_STATE_CHANGE, chats });
        });

        unsubscribe.push(unsubscribeChats);
    };
}

export function fetchUserPosts() {
    return (dispatch) => {
        const firestore = getFirestore();
        const auth = getAuth();

        const postsQuery = query(
            collection(firestore, 'posts', auth.currentUser.uid, 'userPosts'),
            orderBy('creation', 'desc')
        );

        getDocs(postsQuery).then((snapshot) => {
            const posts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            dispatch({ type: USER_POSTS_STATE_CHANGE, posts });
        });
    };
}

export function fetchUserFollowing() {
    return (dispatch) => {
        const firestore = getFirestore();
        const auth = getAuth();

        const followingCollection = collection(firestore, 'following', auth.currentUser.uid, 'userFollowing');
        const unsubscribeFollowing = onSnapshot(followingCollection, (snapshot) => {
            const following = snapshot.docs.map((doc) => doc.id);

            dispatch({ type: USER_FOLLOWING_STATE_CHANGE, following });
            following.forEach((uid) => {
                dispatch(fetchUsersData(uid, true));
            });
        });

        unsubscribe.push(unsubscribeFollowing);
    };
}

export function fetchUsersData(uid, getPosts) {
    return (dispatch, getState) => {
        const firestore = getFirestore();
        const users = getState().usersState.users;
        const userExists = users.some((user) => user.uid === uid);

        if (!userExists) {
            const userDoc = doc(firestore, 'users', uid);
            getDoc(userDoc).then((snapshot) => {
                if (snapshot.exists()) {
                    const user = { uid, ...snapshot.data() };
                    dispatch({ type: USERS_DATA_STATE_CHANGE, user });
                }
            });

            if (getPosts) {
                dispatch(fetchUsersFollowingPosts(uid));
            }
        }
    };
}

export function fetchUsersFollowingPosts(uid) {
    return (dispatch, getState) => {
        const firestore = getFirestore();

        const postsQuery = query(
            collection(firestore, 'posts', uid, 'userPosts'),
            orderBy('creation', 'asc')
        );

        getDocs(postsQuery).then((snapshot) => {
            const user = getState().usersState.users.find((u) => u.uid === uid);

            const posts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                user,
            }));

            posts.forEach((post) => {
                dispatch(fetchUsersFollowingLikes(uid, post.id));
            });

            dispatch({ type: USERS_POSTS_STATE_CHANGE, posts, uid });
        });
    };
}

export function fetchUsersFollowingLikes(uid, postId) {
    return (dispatch) => {
        const firestore = getFirestore();

        const likesDoc = doc(firestore, 'posts', uid, 'userPosts', postId, 'likes', getAuth().currentUser.uid);
        const unsubscribeLikes = onSnapshot(likesDoc, (snapshot) => {
            const currentUserLike = snapshot.exists();
            dispatch({ type: USERS_LIKES_STATE_CHANGE, postId, currentUserLike });
        });

        unsubscribe.push(unsubscribeLikes);
    };
}

export function queryUsersByUsername(username) {
    return () => {
        const firestore = getFirestore();

        if (username.length === 0) {
            return Promise.resolve([]);
        }

        const usersQuery = query(
            collection(firestore, 'users'),
            where('username', '>=', username),
            orderBy('username'),
            limit(10)
        );

        return getDocs(usersQuery).then((snapshot) =>
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
    };
}

export function deletePost(item) {
    return () => {
        const firestore = getFirestore();
        const auth = getAuth();

        const postDoc = doc(firestore, 'posts', auth.currentUser.uid, 'userPosts', item.id);
        return deleteDoc(postDoc);
    };
}
