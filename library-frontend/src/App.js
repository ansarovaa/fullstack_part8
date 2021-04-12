import React, {useState, useEffect} from 'react'
import {useLazyQuery} from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/Login'
import {CURRENT_USER, BOOK_ADDED, ALL_BOOKS} from './queries'
import {useQuery, useMutation, useSubscription, useApolloClient} from '@apollo/client'

const App = () => {
    const [page,
        setPage] = useState('authors')
    const [token,
        setToken] = useState(null)
    const [user,
        setUser] = useState(null)
    const [getCurrentUser,
        currentUserResult] = useLazyQuery(CURRENT_USER, {fetchPolicy: "network-only"})
    const [errorMessage,
        setErrorMessage] = useState(null)
    const client = useApolloClient()

    useEffect(() => {
        const token = localStorage.getItem('libraryapp-user-token')
        if (token) {
            setToken(token)
            getCurrentUser()
        }
    }, [])

    useEffect(() => {
        if (currentUserResult.data) {
            setUser(currentUserResult.data.me)
        }
    }, [currentUserResult.data])

    const updateCacheWith = (addedBook) => {
        const includedIn = (set, object) => set
            .map(p => p.id)
            .includes(object.id)

        const dataInStore = client.readQuery({query: ALL_BOOKS})
        if (!includedIn(dataInStore.allBooks, addedBook)) {
            client.writeQuery({
                query: ALL_BOOKS,
                data: {
                    allBooks: dataInStore
                        .allBooks
                        .concat(addedBook)
                }
            })
        }
    }

    useSubscription(BOOK_ADDED, {
        onSubscriptionData: ({subscriptionData}) => {
            const addedBook = subscriptionData.data.bookAdded
            notify(`${addedBook.title} added`)
            updateCacheWith(addedBook)
        }
    })

    const setNewToken = (newToken) => {
        setToken(newToken)
        localStorage.setItem('libraryapp-user-token', newToken)
        setPage('authors')
        getCurrentUser()
    }

    const logout = () => {
        setToken(null)
        localStorage.clear('libraryapp-user-token')
        setPage('authors')
        setUser(null)
    }

    const notify = (message) => {
        setErrorMessage(message)
        setTimeout(() => {
            setErrorMessage(null)
        }, 5000)
    }

    return (
        <div>
            <div>{errorMessage}</div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
                {token
                    ? <button onClick={() => setPage('add')}>Add Book</button>
                    : null}
                {token
                    ? <button onClick={() => setPage('recommend')}>Recommend</button>
                    : null}
                {token
                    ? <button onClick={() => logout()}>Logout</button>
                    : <button onClick={() => setPage('login')}>Login</button>}
            </div>

            <Authors show={page === 'authors'}/>

            <Books show={page === 'books'}/>

            <Books
                show={page === 'recommend'}
                genreToShow={user
                ? user.favoriteGenre
                : null}/>

            <NewBook show={page === 'add'}/>
            <Login show={page === 'login'} setError={notify} setNewToken={setNewToken}/>

        </div>
    )
}

export default App