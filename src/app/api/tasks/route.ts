// to get some types of our schema
interface Task {
    id: number;
    title: string;
    completed: boolean;
}
// to make it type save create typr interface for body
interface creatTaskBody {
    title: string;
}

// to create data instead of our DB
let tasks: Task[] = [
    { id: 1, title: "Learn Next.js", completed: false },
    { id: 2, title: "Build a project", completed: false },
];


export const dynamic = "force-dynamic";

//handler 1
export async function GET() {
    return Response.json(tasks);
}

//handler 2
export async function POST(request: Request) {
    try {
        // const body = await request.json();// to make it type save create typr interface for body
        const body : creatTaskBody = await request.json();// updated
        if (!body.title) { // now its type save
            return Response.json({ error: "Title is required" }, { status: 400 });
        }
        const newTask: Task = { // like using node without express
            id: tasks.length + 1,
            title: body.title,
            completed: false,
        };
        tasks.push(newTask); // like using node without express
        return Response.json(newTask, { status: 201 });// no enveloping and the state is the 2nd argument
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}

//handler 3
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = parseInt(url.searchParams.get("id") || "");
        //-------------------------------------------------------------------
        // const { searchParams } = new URL(request.url);
        // const id = parseInt(searchParams.get("id") || "");
        //-------------------------------------------------------------------
        if (!id) {
            return Response.json({ error: "Id is required" }, { status: 400 });
        }
        //----------------------------------------------- check if not found
        const taskIndex = tasks.findIndex((task) => task.id === id);
        if (taskIndex === -1) {
            return Response.json({ error: "Task not found" }, { status: 404 });
        }
        //-------------------------------------------------------------------
        tasks = tasks.filter((task) => task.id !== id);
        return Response.json({ message: "Task deleted" });
        //-------------------------------------------------------------------
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}

//-------------------- if we have a client page that uses these APIs
/*
    maybe a server-component
*/

async function getTasksPage() {
    // const response = await fetch(`${'root'}/api/tasks`); // by default it's going to be cashed
    const response = await fetch(`${'root'}/api/tasks` ,{cache : "no-store"});
    const tasks = await response.json();

    console.log(tasks)
    return '<h1>getTasksPage</h1>'; // for ex
}







