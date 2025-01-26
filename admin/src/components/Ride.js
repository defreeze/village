import React, { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { Paper, Avatar, Divider, CircularProgress, Button, TextField } from '@material-ui/core';
import { getFirestore, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function Ride(props) {
    const [user, setUser] = useState(null);
    const [banReason, setBanReason] = useState('');
    const location = useLocation();

    useEffect(() => {
        const userDocRef = doc(db, "users", props.match.params.id);

        const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                userData.uid = snapshot.id;
                setUser(userData);
            }
        });

        // Cleanup the listener
        return () => unsubscribe();
    }, [props.match.params.id]);

    const banUser = async () => {
        const currentUserUid = auth.currentUser?.uid; // Get the current user ID
        if (!currentUserUid) return;

        const currentUserDocRef = doc(db, "users", currentUserUid);

        await updateDoc(currentUserDocRef, {
            banned: true,
            banDetails: {
                banReason,
                date: serverTimestamp(),
            },
        });
    };

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
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Phone Number</p>
                    <p style={{ textAlign: 'left' }}>{user.phoneNumber}</p>

                    <Divider className="mb-3" />
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Birthday</p>
                    <p>{user.birthday}</p>

                    <Divider className="mb-3" />
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Last Login</p>
                    <p>{user.lastLogin}</p>

                    <Divider className="mb-3" />
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Phone Info</p>
                    <p>{user.device}</p>

                    <Divider className="mb-3" />
                    <p style={{ textAlign: 'left', fontWeight: 'bold' }}>Identification</p>
                    <Button
                        variant="contained"
                        color="primary"
                        className="mr-2 col-md-3"
                        href={user.identification?.backIdImageURL}
                        target="_blank"
                    >
                        Back Driver's License
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        className="mr-2 col-md-3"
                        href={user.identification?.frontIdImageURL}
                        target="_blank"
                    >
                        Front Driver's License
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        className="mr-2 col-md-3"
                        href={user.identification?.photo}
                        target="_blank"
                    >
                        Photo
                    </Button>
                </div>
            </Paper>

            <Paper className="col-md-3 m-3 p-5" elevation={5}>
                <TextField
                    className="col-md-12"
                    id="outlined-required"
                    label="Tokens"
                    defaultValue={user.tokens}
                    variant="outlined"
                    inputMode="numeric"
                />
                <Button className="col-md-12 mt-5" variant="contained" color="primary">
                    Save
                </Button>
            </Paper>

            <Paper className="col-md-3 m-3 p-5" elevation={5}>
                <TextField
                    className="col-md-12"
                    id="outlined-required"
                    label="Ban Reason"
                    defaultValue=""
                    multiline={true}
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
            </Paper>
        </div>
    );
}
