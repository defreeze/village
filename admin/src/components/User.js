import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { Paper, Avatar, Divider, CircularProgress, Button, TextField } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';
import { getFirestore, collection, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function User(props) {
    const [user, setUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [posts, setPosts] = useState([]);
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        //const postsCollectionRef = collection(db, "posts", props.match.params.id, "userPosts");
        const { uid, id } = props.match?.params || {};

        if (!uid || !id) {
        console.error("Error: Missing parameters for Firestore collection reference.");
        } else {
        const commentsCollectionRef = collection(firestore, "posts", uid, "userPosts", id, "comments");
        }


        const unsubscribePosts = onSnapshot(postsCollectionRef, (snapshot) => {
            const result = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPosts(result);
        });

        return () => unsubscribePosts();
    }, [props.match.params.id]);

    useEffect(() => {
        const userDocRef = doc(db, "users", props.match.params.id);

        const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                userData.uid = snapshot.id;
                setUser(userData);
            }
        });

        return () => unsubscribeUser();
    }, [props.match.params.id]);

    const banUser = async () => {
        const userDocRef = doc(db, "users", props.match.params.id);

        await updateDoc(userDocRef, {
            banned: true,
            banDetails: {
                banReason: banReason,
                date: serverTimestamp(),
            },
        });
    };

    const unbanUser = async () => {
        const userDocRef = doc(db, "users", props.match.params.id);

        await updateDoc(userDocRef, {
            banned: false,
            banDetails: {},
        });
    };

    const columns = [
        { field: 'caption', headerName: 'Caption', width: 400 },
        { field: 'likesCount', headerName: 'Likes Count', width: 130 },
        { field: 'commentsCount', headerName: 'Comments Count', width: 130 },
        {
            field: 'creation',
            headerName: 'Creation',
            width: 200,
            valueGetter: (params) => `${new Date(params.value.seconds * 1000)}`,
        },
        {
            field: 'link',
            headerName: 'Detail',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        history.push(`/post/${params.row.id}/${props.match.params.id}`);
                    }}
                >
                    View
                </Button>
            ),
        },
    ];

    if (!user) {
        return (
            <CircularProgress
                variant="indeterminate"
                size={40}
                thickness={4}
                value={100}
            />
        );
    }

    return (
        <div className="row m-5">
            <Paper className="col-md-3 m-3" elevation={5}>
                <div style={{ alignItems: 'center' }} className="p-5">
                    <Avatar
                        style={{ height: '200px', width: '200px' }}
                        className="m-auto mb-4"
                        alt="User Avatar"
                        src={user.image}
                    />
                    <h3 style={{ textAlign: 'center' }} className="mt-4">{user.name}</h3>
                    <h6 style={{ textAlign: 'center' }}>{user.username}</h6>
                </div>
            </Paper>

            <Paper className="col-md-8 m-3" elevation={5}>
                <div style={{ alignItems: 'center' }} className="p-5">
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Email</p>
                    <p style={{ textAlign: 'left' }}>{user.email}</p>
                    <Divider className="mb-3" />
                </div>
            </Paper>

            <Paper className="col-md-3 m-3 p-5" elevation={5}>
                {!user.banned ? (
                    <div>
                        <TextField
                            className="col-md-12"
                            id="outlined-required"
                            label="Ban Reason"
                            multiline
                            variant="outlined"
                            onChange={(e) => setBanReason(e.target.value)}
                        />
                        <Button
                            className="col-md-12 mt-5"
                            variant="contained"
                            color="secondary"
                            onClick={banUser}
                        >
                            Ban
                        </Button>
                    </div>
                ) : (
                    <div>
                        <Button
                            className="col-md-12 mt-5"
                            variant="contained"
                            color="secondary"
                            onClick={unbanUser}
                        >
                            Unban
                        </Button>
                    </div>
                )}
            </Paper>

            <Paper className="col-md-8 m-3 p-5" elevation={5} style={{ height: 400 }}>
                <DataGrid
                    rows={posts}
                    columns={columns.map((column) => ({
                        ...column,
                        disableClickEventBubbling: true,
                    }))}
                    pageSize={5}
                />
            </Paper>
        </div>
    );
}
