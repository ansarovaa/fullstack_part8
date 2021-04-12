import React, {useEffect, useState} from 'react'
import {useApolloClient, useLazyQuery, useQuery} from "@apollo/client"
import {ALL_BOOKS} from "../queries"
import Genre from './Genre'

const Books = ({show, genreToShow}) => {
    const result = useQuery(ALL_BOOKS)
    const [getAllBooks,
        resultat] = useLazyQuery(ALL_BOOKS)
    const [genre,
        setGenre] = useState(null)
    const client = useApolloClient()

    useEffect(() => {
        setGenre(genreToShow);
    }, [genreToShow]);

    useEffect(() => {
        if (genre) {
            getAllBooks({
                variables: {
                    genre: genre
                }
            })
        } else {
            getAllBooks()
        }
    }, [genre])

    const setNewGenre = (newGenre) => {
        client
            .cache
            .evict({
                fieldName: 'allBooks',
                args: {
                    genre: genre
                }
            })
        setGenre(newGenre)
    }

    if (!show) {
        return null
    }

    if (result.loading || resultat.loading) {
        return <div>loading...</div>
    }

    return (
        <div>
            {genreToShow
                ? <h2>Recommendations</h2>
                : <h2>Books</h2>
}
            {genreToShow
                ? <h3>Books in your favorite genre '{genreToShow}'</h3>
                : (genre
                    ? <h3>In genre '{genre}'</h3>
                    : <h3>All genres</h3>)
}
            <table>
                <tbody>
                    <tr>
                        <th>title</th>
                        <th>
                            author
                        </th>
                        <th>
                            published
                        </th>
                        <th>
                            genre
                        </th>
                    </tr>
                    {resultat
                        .data
                        .allBooks
                        .map(a => <tr key={a.title}>
                            <td>{a.title}</td>
                            <td>{a.author.name}</td>
                            <td>{a.published}</td>
                            <td>{a
                                    .genres
                                    .join(', ')}</td>
                        </tr>)}
                </tbody>
            </table>
            {genreToShow
                ? null
                : <Genre setGenre={setNewGenre}/>}
        </div>
    )
}

export default Books