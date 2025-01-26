import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { Divider } from 'react-native-paper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUsersData } from '../../../redux/actions/index';
import { container, text, utils } from '../../styles';
import { timeDifference } from '../../utils';
import CachedImage from '../random/CachedImage';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, updateDoc, addDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

function Chat(props) {
    const [chats, setChats] = useState([]);
    const [input, setInput] = useState("");
    const [textInput, setTextInput] = useState(null);

    useEffect(() => {
        for (let i = 0; i < props.chats.length; i++) {
            if (props.chats[i].hasOwnProperty('otherUser')) continue;

            let otherUserId;
            if (props.chats[i].users[0] === auth.currentUser.uid) {
                otherUserId = props.chats[i].users[1];
            } else {
                otherUserId = props.chats[i].users[0];
            }

            const user = props.users.find((x) => x.uid === otherUserId);
            if (!user) {
                props.fetchUsersData(otherUserId, false);
            } else {
                props.chats[i].otherUser = user;
            }
        }
        setChats(props.chats);
    }, [props.chats, props.users]);

    const sendPost = async (item) => {
        if (item.sent) return;

        const textToSend = input;
        setInput("");
        textInput.clear();

        const post = { ...props.route.params.post };
        delete post.doc;

        const chatMessagesRef = collection(db, 'chats', item.id, 'messages');
        const chatRef = doc(db, 'chats', item.id);

        await addDoc(chatMessagesRef, {
            creator: auth.currentUser.uid,
            text: textToSend,
            post,
            creation: new Date(),
        });

        await updateDoc(chatRef, {
            lastMessage: "post sent",
            lastMessageTimestamp: new Date(),
        });

        props.navigation.popToTop();
    };

    let share = false;
    let item = null;

    if (props.route.params) {
        share = props.route.params.share;
        item = props.route.params.post;
    }

    if (!chats.length) {
        return (
            <View style={{ height: '100%', justifyContent: 'center', margin: 'auto' }}>
                <FontAwesome5 style={{ alignSelf: 'center', marginBottom: 20 }} name="comments" size={40} color="black" />
                <Text style={[text.notAvailable]}>No chats available</Text>
            </View>
        );
    }

    return (
        <View style={[container.container, container.alignItemsCenter, utils.backgroundWhite]}>
            {item && (
                <View style={{ flexDirection: 'row', padding: 20 }}>
                    <TextInput
                        style={[container.fillHorizontal, container.input, container.container]}
                        multiline
                        ref={setTextInput}
                        placeholder="Write a message . . ."
                        onChangeText={(caption) => setInput(caption)}
                    />
                    {item.type === 1 ? (
                        <Image
                            style={{ aspectRatio: 1, backgroundColor: 'black', height: 80 }}
                            source={{ uri: props.route.params.post.downloadURL }}
                        />
                    ) : (
                        <CachedImage
                            cacheKey={item.id}
                            style={{ aspectRatio: 1, height: 80 }}
                            source={{ uri: props.route.params.post.downloadURLStill }}
                        />
                    )}
                </View>
            )}

            <Divider />
            <FlatList
                numColumns={1}
                horizontal={false}
                data={chats}
                keyExtractor={(item, index) => item.id}
                renderItem={({ item }) => (
                    <View style={!item[auth.currentUser.uid] ? { backgroundColor: '#d2eeff' } : null}>
                        {!item.otherUser ? (
                            <FontAwesome5 style={[utils.profileImageSmall]} name="user-circle" size={35} color="black" />
                        ) : (
                            <TouchableOpacity
                                style={[utils.padding15, container.horizontal]}
                                activeOpacity={share ? 1 : 0}
                                onPress={() => {
                                    if (!share) {
                                        props.navigation.navigate("Chat", { user: item.otherUser });
                                    }
                                }}
                            >
                                <View style={container.horizontal}>
                                    {item.otherUser.image === 'default' ? (
                                        <FontAwesome5 style={[utils.profileImageSmall]} name="user-circle" size={35} color="black" />
                                    ) : (
                                        <Image
                                            style={[utils.profileImageSmall]}
                                            source={{ uri: item.otherUser.image }}
                                        />
                                    )}
                                </View>

                                <View>
                                    <Text style={[text.bold]}>{item.otherUser.name}</Text>
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={[utils.margin15Right, utils.margin5Bottom, { paddingBottom: 10 }]}
                                    >
                                        {item.lastMessage}{" "}
                                        {item.lastMessageTimestamp ? (
                                            <Text
                                                style={[text.grey, text.small, utils.margin5Bottom]}
                                            >
                                                {timeDifference(new Date(), item.lastMessageTimestamp.toDate())}
                                            </Text>
                                        ) : (
                                            <Text style={[text.grey, text.small, utils.margin5Bottom]}>
                                                Now
                                            </Text>
                                        )}
                                    </Text>
                                </View>

                                {share && (
                                    <TouchableOpacity
                                        style={[
                                            utils.buttonOutlined,
                                            utils.margin15Right,
                                            { backgroundColor: '#0095ff', marginLeft: 'auto', justifyContent: 'center' },
                                        ]}
                                        onPress={() => sendPost(item)}
                                    >
                                        <Text
                                            style={[
                                                text.bold,
                                                { color: 'white', textAlign: 'center', textAlignVertical: 'center' },
                                            ]}
                                        >
                                            Send
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    chats: store.userState.chats,
    users: store.usersState.users,
});

const mapDispatchProps = (dispatch) =>
    bindActionCreators({ fetchUsersData }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Chat);
