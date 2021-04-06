import React, {useState} from 'react'
import {useQuery, useMutation} from "@apollo/client";
import {ALL_AUTHORS, EDIT_AUTHOR} from "../queries";

const Authors = ({show}) => {
    const [name,
        setName] = useState('')
    let [born,
        setBorn] = useState('')

    const result = useQuery(ALL_AUTHORS)
    const [changeYear] = useMutation(EDIT_AUTHOR, {
        refetchQueries: [
            {
                query: ALL_AUTHORS
            }
        ]
    })

    if (!show) {
        return null
    }

    if (result.loading) {
        return <div>loading...</div>
    }

    const submit = (event) => {
        event.preventDefault()
        born = Number(born)
        changeYear({
            variables: {
                name,
                born
            }
        })

        setName('')
        setBorn('')
    }

    return (
        <div>
            <h2>authors</h2>
            <table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>
                            born
                        </th>
                        <th>
                            books
                        </th>
                    </tr>
                    {result
                        .data
                        .allAuthors
                        .map(a => <tr key={a.name}>
                            <td>{a.name}</td>
                            <td>{a.born}</td>
                            <td>{a.bookCount}</td>
                        </tr>)}
                </tbody>
            </table>
            <div>
                <h2>Set birthyear</h2>
                <form onSubmit={submit}>
                    <div>
                        name
                        <input value={name} onChange={({target}) => setName(target.value)}/>
                    </div>
                    <div>
                        born
                        <input value={born} onChange={({target}) => setBorn(target.value)}/>
                    </div>
                    <button type='submit'>update year</button>
                </form>
            </div>
        </div>
    )
}

export default Authors
