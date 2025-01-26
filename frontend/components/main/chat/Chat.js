import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CachedImage from 'react-native-expo-cached-image';
import { Provider } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchFeedPosts, fetchUserChats, sendNotification } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';
import { getFirestore, collection, doc, query, where, getDoc, getDocs, addDoc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const db = getFirestore();

function Chat(props) {
    const [user, setUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [textInput, setTextInput] = useState(null);
    const [flatList, setFlatList] = useState(null);
    const [initialFetch, setInitialFetch] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (props.route.params.notification) {
                const userDocRef = doc(db, "users", props.route.params.user);
                const snapshot = await getDoc(userDocRef);
                if (snapshot.exists()) {
                    const userData = snapshot.data();
                    userData.uid = snapshot.id;
                    setUser(userData);
                }
            } else {
                setUser(props.route.params.user);
            }
        };

        fetchUser();
    }, [props.route.params.notification, props.route.params.user]);

    useEffect(() => {
        if (!user || initialFetch) return;

        const foundChat = props.chats.find((el) => el.users.includes(user.uid));
        setChat(foundChat);

        props.navigation.setOptions({
            headerTitle: () => (
                <View style={[container.horizontal, utils.alignItemsCenter, { overflow: 'hidden' }]}>
                    {user.image === 'default' ? (
                        <FontAwesome5
                            style={[utils.profileImageSmall]}
                            name="user-circle"
                            size={35}
                            color="black"
                        />
                    ) : (
                        <Image
                            style={[utils.profileImageSmall]}
                            source={{ uri: user.image }}
                        />
                    )}
                    <Text
                        style={[text.bold, text.large, { flex: 1 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {user.username}
                    </Text>
                </View>
            ),
        });

        if (foundChat) {
            const messagesQuery = query(
                collection(db, "chats", foundChat.id, "messages"),
                orderBy("creation", "asc")
            );

            const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setMessages(fetchedMessages);
            });

            const chatDocRef = doc(db, "chats", foundChat.id);
            updateDoc(chatDocRef, {
                [auth.currentUser.uid]: true,
            });

            setInitialFetch(true);

            return () => unsubscribe();
        } else {
            createChat();
        }
    }, [user, props.chats]);

    const createChat = async () => {
        const chatDocRef = await addDoc(collection(db, "chats"), {
            users: [auth.currentUser.uid, user.uid],
            lastMessage: "Send the first message",
            lastMessageTimestamp: null,
        });
        props.fetchUserChats();
    };

    const onSend = async () => {
        if (!chat || input.trim() === "") return;

        const textToSend = input;
        setInput("");
        textInput?.clear();

        const messagesCollectionRef = collection(db, "chats", chat.id, "messages");
        await addDoc(messagesCollectionRef, {
            creator: auth.currentUser.uid,
            text: textToSend,
            creation: new Date(),
        });

        const chatDocRef = doc(db, "chats", chat.id);
        await updateDoc(chatDocRef, {
            lastMessage: textToSend,
            lastMessageTimestamp: new Date(),
            [chat.users[0]]: false,
            [chat.users[1]]: false,
        });

        props.sendNotification(
            user.notificationToken,
            "New Message",
            textToSend,
            { type: "chat", user: auth.currentUser.uid }
        );
    };

    return (
        <View style={[container.container, container.alignItemsCenter, utils.backgroundWhite]}>
            <Provider>
                <FlatList
                    numColumns={1}
                    horizontal={false}
                    data={messages}
                    ref={setFlatList}
                    onContentSizeChange={() => flatList?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                utils.padding10,
                                container.container,
                                item.creator === auth.currentUser.uid
                                    ? container.chatRight
                                    : container.chatLeft,
                            ]}
                        >
                            {item.creator !== undefined && item.creation !== null ? (
                                <View style={container.horizontal}>
                                    <View>
                                        <Text style={[utils.margin5Bottom, text.white]}>
                                            {item.text}
                                        </Text>
                                        {item.post && (
                                            <TouchableOpacity
                                                style={{ marginBottom: 20, marginTop: 10 }}
                                                onPress={() =>
                                                    props.navigation.navigate("Post", {
                                                        item: item.post,
                                                        user: item.post.user,
                                                    })
                                                }
                                            >
                                                <CachedImage
                                                    cacheKey={item.id}
                                                    style={{ aspectRatio: 1, width: 200 }}
                                                    source={{ uri: item.post.downloadURL }}
                                                />
                                            </TouchableOpacity>
                                        )}
                                        <Text
                                            style={[
                                                text.grey,
                                                text.small,
                                                utils.margin5Bottom,
                                                text.whitesmoke,
                                            ]}
                                        >
                                            {timeDifference(new Date(), new Date(item.creation))}
                                        </Text>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    )}
                />
                <View
                    style={[
                        container.horizontal,
                        utils.padding10,
                        utils.alignItemsCenter,
                        utils.backgroundWhite,
                        utils.borderTopGray,
                    ]}
                >
                    {props.currentUser.image === 'default' ? (
                        <FontAwesome5
                            style={[utils.profileImageSmall]}
                            name="user-circle"
                            size={35}
                            color="black"
                        />
                    ) : (
                        <Image
                            style={[utils.profileImageSmall]}
                            source={{ uri: props.currentUser.image }}
                        />
                    )}
                    <View style={[container.horizontal, utils.justifyCenter, utils.alignItemsCenter]}>
                        <TextInput
                            ref={(input) => setTextInput(input)}
                            value={input}
                            multiline={true}
                            style={[container.fillHorizontal, container.input, container.container]}
                            placeholder="message..."
                            onChangeText={setInput}
                        />
                        <TouchableOpacity
                            onPress={onSend}
                            style={{ width: 100, alignSelf: "center" }}
                        >
                            <Text style={[text.bold, text.medium, text.deepskyblue]}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Provider>
        </View>
    );
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    chats: store.userState.chats,
    following: store.userState.following,
    feed: store.usersState.feed,
});

const mapDispatchProps = (dispatch) =>
    bindActionCreators({ fetchUserChats, sendNotification, fetchFeedPosts }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Chat);
