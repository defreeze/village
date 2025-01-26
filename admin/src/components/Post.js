import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from "react-router-dom";
import { Paper, Divider, CircularProgress, Button } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';
import { doc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure db is properly exported from your firebase.js file

export default function Post(props) {
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const location = useLocation();
    const history = useHistory();

    // Fetch post data
    useEffect(() => {
        const { uid, id } = props.match.params;

        if (!uid || !id) {
            console.error("Error: Missing parameters for Firestore document reference.");
            return;
        }

        const postDocRef = doc(db, "posts", uid, "userPosts", id);

        const unsubscribe = onSnapshot(postDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const result = snapshot.data();
                result.id = snapshot.id;
                setPost(result);
            }
        });

        // Cleanup listener
        return () => unsubscribe();
    }, [props.match.params]);

    // Fetch comments
    useEffect(() => {
        const { uid, id } = props.match.params;

        if (!uid || !id) {
            console.error("Error: Missing parameters for Firestore collection reference.");
            return;
        }

        if (!post) return;

        const commentsCollectionRef = collection(db, "posts", uid, "userPosts", id, "comments");

        const unsubscribe = onSnapshot(commentsCollectionRef, (snapshot) => {
            const result = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setComments(result);
            setLoaded(true);
        });

        // Cleanup listener
        return () => unsubscribe();
    }, [post, props.match.params]);

    // Delete a single comment
    const deleteComment = async (commentId) => {
        const { uid, id } = props.match.params;

        if (!uid || !id || !commentId) {
            console.error("Error: Missing parameters for Firestore document deletion.");
            return;
        }

        const commentDocRef = doc(db, "posts", uid, "userPosts", id, "comments", commentId);
        await deleteDoc(commentDocRef);
    };

    // Delete a post
    const deletePost = async () => {
        const { uid, id } = props.match.params;

        if (!uid || !id || !post?.id) {
            console.error("Error: Missing parameters for Firestore document deletion.");
            return;
        }

        const postDocRef = doc(db, "posts", uid, "userPosts", id);
        const feedDocRef = doc(db, "feed", post.id);

        await deleteDoc(postDocRef);
        await deleteDoc(feedDocRef);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 280 },
        { field: 'text', headerName: 'Text', width: 400 },
        {
            field: 'delete',
            headerName: 'Delete',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => deleteComment(params.row.id)}
                >
                    Delete
                </Button>
            ),
        },
        {
            field: 'user',
            headerName: 'User',
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => history.push(`/user/${params.row.creator}`)}
                >
                    View
                </Button>
            ),
        },
    ];

    if (!loaded) {
        return (
            <CircularProgress
                variant="indeterminate"
                size={40}
                thickness={4}
                value={100}
            />
        );
    }

    const date = new Date(post.creation.seconds * 1000);

    return (
        <div className="row m-5">
            <Paper className="col-md-8 m-3 p-5" elevation={5}>
                <div style={{ alignItems: 'center' }} className="pb-4">
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Caption</p>
                    <p style={{ textAlign: 'left' }}>{post.caption}</p>
                    <Divider className="mb-3" />
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Date</p>
                    <p>{date.toString()}</p>
                </div>

                <Button
                    variant="contained"
                    color="primary"
                    className="mr-2 col-md-3"
                    href={post.downloadURL}
                    target="_blank"
                >
                    Open Media
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={deletePost}
                >
                    Delete
                </Button>
            </Paper>

            <Paper
                className="m-3"
                style={{ height: 400, width: '100%', marginTop: '100px', backgroundColor: 'white' }}
                elevation={5}
            >
                <DataGrid
                    rows={comments}
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
