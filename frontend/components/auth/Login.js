import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { container, form } from '../styles';

export default function Login(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Initialize Firebase Auth
    const auth = getAuth();

    const onSignIn = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('User signed in:', userCredential.user);
                // Add any post-login logic here
            })
            .catch((error) => {
                console.error('Error signing in:', error.message);
            });
    };

    return (
        <View style={container.center}>
            <View style={container.formCenter}>
                <TextInput
                    style={form.textInput}
                    placeholder="email"
                    onChangeText={(email) => setEmail(email)}
                    value={email}
                />
                <TextInput
                    style={form.textInput}
                    placeholder="password"
                    secureTextEntry={true}
                    onChangeText={(password) => setPassword(password)}
                    value={password}
                />

                <Button
                    style={form.button}
                    onPress={onSignIn}
                    title="Sign In"
                />
            </View>

            <View style={form.bottomButton}>
                <Text
                    title="Register"
                    onPress={() => props.navigation.navigate("Register")}
                >
                    Don't have an account? Sign Up.
                </Text>
            </View>
        </View>
    );
}
