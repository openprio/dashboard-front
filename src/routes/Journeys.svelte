<script lang="ts">
    import Navigation from "../components/Navigation.svelte";
    import { createColumnHelper, createSvelteTable, getCoreRowModel } from '../lib/table';


    type UserProfile = {
        id: string;
        name: string;
        age: number;
        email: string;
        phone: string;
    };

    // 💡 Create a column helper for the user profile data.
    // It's not necessary, but it helps with typescript stuff.
    const colHelp = createColumnHelper<UserProfile>();

    // Define the columns using the column helper.
    // This is a basic example. Check other examples for more complexity.
    const columnDefs = [
        colHelp.accessor('name', { header: 'Name' }),
        colHelp.accessor('age', { header: 'Age' }),
        colHelp.accessor('email', { header: 'Email' }),
        colHelp.accessor('phone', { header: 'Phone' })
    ];

    // Create the table.
    const table = createSvelteTable({
    data: [
        {
            id: "test",
            name: "test",
            age: 2,
            email: "10",
            phone: "23"
        },
        {
            id: "test",
            name: "test",
            age: 2,
            email: "10",
            phone: "23"
        },
        {
            id: "test",
            name: "test",
            age: 2,
            email: "10",
            phone: "23"
        },
        {
            id: "test",
            name: "test",
            age: 2,
            email: "10",
            phone: "23"
        }
    ],
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel()
    });
</script>
<Navigation></Navigation>

<div>
<table>
    <thead>
      <tr>
        {#each table.getHeaderGroups() as headerGroup}
          {#each headerGroup.headers as header}
            <th>{header.column.columnDef.header}</th>
          {/each}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.getRowModel().rows as row}
        <tr>
          {#each row.getVisibleCells() as cell}
            <td>{cell.getValue()}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 20px;
}

.table-container {
    max-width: 800px;
    margin: auto;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

table {
    width: 100%;
    border-collapse: collapse;
    background-color: #ffffff;
}

th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    background-color: #4CAF50;
    color: white;
    text-transform: uppercase;
}

tbody tr:hover {
    background-color: #f1f1f1;
}

tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}

tbody tr:nth-child(odd) {
    background-color: #ffffff;
}

tr:last-child td {
    border-bottom: none;
}

@media (max-width: 600px) {
    th, td {
        padding: 10px;
        font-size: 14px;
    }
}

</style>