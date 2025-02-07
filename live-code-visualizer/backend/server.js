const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const CODE_DIR = path.join(__dirname, 'sandbox');
const TIMEOUT = 5000; // 5 seconds max execution time

if (!fs.existsSync(CODE_DIR)) {
    fs.mkdirSync(CODE_DIR);
}

app.post('/run', (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const fileName = `program_${Date.now()}.cpp`;
    const filePath = path.join(CODE_DIR, fileName);
    const execFile = filePath.replace('.cpp', '');

    fs.writeFileSync(filePath, code);

    const compileCommand = `g++ ${filePath} -o ${execFile} 2>&1`;
    exec(compileCommand, (compileErr, compileStdout, compileStderr) => {
        if (compileErr) {
            return res.json({ error: compileStdout || compileStderr });
        }

        const runCommand = `start /B ${execFile}`;
        // exec(runCommand, (runErr, runStdout, runStderr) => {
        //     fs.unlinkSync(filePath); // Cleanup source file
        //     fs.unlinkSync(execFile); // Cleanup binary
        //     if (runErr) {
        //         return res.json({ error: runStderr || 'Execution error' });
        //     }
        //     res.json({ output: runStdout });
        // });
        exec(runCommand, (runErr, runStdout, runStderr) => {
            // Check if the file exists before deleting
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(execFile)) fs.unlinkSync(execFile);
            
            if (runErr) {
                return res.json({ error: runStderr || 'Execution error' });
            }
            res.json({ output: runStdout });
        });
        
    });
});

app.listen(5000, () => console.log('Server running on port 5000'));
