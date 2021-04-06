import React, {useState} from 'react'
import Select from 'react-select'
import {useQuery, useMutation} from "@apollo/client"
import {ALL_AUTHORS, EDIT_AUTHOR} from "../queries"

const Authors = ({show}) => {
    const [name,
        setName] = useState('')
    let [born,
        setBorn] = useState('')

    const {loading, data} = useQuery(ALL_AUTHORS)
    const [changeYear] = useMutation(EDIT_AUTHOR, {
        refetchQueries: [
            {
                query: ALL_AUTHORS
            }
        ]
    })

    const options = data?.allAuthors?.map((option) => {
                return {
                    value: option
                        .name
                        .toLowerCase(),
                    label: option.name
                };
            });

    if (!show) {
        return null
    }

    if (loading) {
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
                    {data
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
                        <Select
                            placeholder="Select author..."
                            options = {options}
                            onChange={({label}) => setName(label)}/>
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