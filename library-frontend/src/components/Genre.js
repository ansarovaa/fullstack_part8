import React from 'react'
import {useQuery} from '@apollo/client'
import {ALL_BOOKS} from '../queries'

const Genre = ({setGenre}) => {
    const allBooks = useQuery(ALL_BOOKS)

    if (allBooks.loading) {
        return <div>Loading...</div>
    }

    return (
        <div>
            {allBooks
                .data
                .allBooks
                .map(b => b.genres)
                .reduce(function (a, b) {
                    return a.concat(b);
                }, [])
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(g => <button key={g} onClick={() => setGenre(g)}>{g}</button>)
}
            <button onClick={() => setGenre(null)}>All genres</button>
        </div>
    )
}

export default Genre