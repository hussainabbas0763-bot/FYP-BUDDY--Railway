import axios from "axios";

// Push Cloud File to GitHub
export const pushCloudFileToGitHub = async (req, res) => {
  try {
    const { cloudUrl, groupName, phase } = req.body;
    if (!cloudUrl || !groupName || !phase) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const safeGroup = groupName.replace(/\s+/g, "-");
    const fileName = `${phase}/${safeGroup}.pdf`;

    // 🔹 Check if file already exists on GitHub
    const checkUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${encodeURIComponent(fileName)}`;
    try {
      await axios.head(checkUrl, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      });
      return res.status(200).json({
        success: false,
        message: "File Already pushed to GitHub.",
        code: "ALREADY_EXISTS",
        pathInRepo: fileName,
      });
    } catch (err) {
      if (err.response && err.response.status !== 404) {
        return res.status(500).json({
          success: false,
          message: "Error checking GitHub file.",
          error: err.response?.data || err.message,
        });
      }
    }

    // 🔹 Fetch PDF from cloud storage
    const cloudRes = await axios.get(cloudUrl, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(cloudRes.data);
    const base64Content = fileBuffer.toString("base64");

    // 🔹 Push to GitHub repository
    const url = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${encodeURIComponent(fileName)}`;
    const commitMessage = `Upload submission: ${safeGroup} (${phase})`;
    const githubRes = await axios.put(
      url,
      { message: commitMessage, content: base64Content, branch: process.env.BRANCH || "main" },
      { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
    );

    return res.status(200).json({
      success: true,
      message: "File pushed to GitHub successfully.",
      pathInRepo: githubRes.data.content.path,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unexpected error while pushing to GitHub.",
      error: err.response?.data?.message || err.message,
    });
  }
};

// ✅ NEW: Fetch only file metadata (names, paths, phases) - Fast!
export const fetchAllFileMetadata = async (req, res) => {
  try {
    const repoOwner = process.env.REPO_OWNER;
    const repoName = process.env.REPO_NAME;
    const branch = process.env.BRANCH || "main";

    // Recursively fetch all contents from the repository
    const getContentsRecursively = async (path = "") => {
      const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}?ref=${branch}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      });

      let files = [];
      for (const item of response.data) {
        if (item.type === "file" && item.name.endsWith(".pdf")) {
          const pathParts = item.path.split("/");
          const phase = pathParts[0] || "root";
          
          files.push({
            name: item.name,
            path: item.path,
            phase: phase,
            size: item.size,
            sha: item.sha,
          });
        } else if (item.type === "dir") {
          // Recursively fetch files from subdirectories
          const subFiles = await getContentsRecursively(item.path);
          files = files.concat(subFiles);
        }
      }
      return files;
    };

    const allFiles = await getContentsRecursively();

    return res.status(200).json({
      success: true,
      message: `Found ${allFiles.length} PDF files.`,
      files: allFiles,
    });
  } catch (err) {
    console.error("[Metadata Fetch Error]", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch file metadata from GitHub.",
      error: err.message,
    });
  }
};

// ✅ NEW: Fetch and serve a single file on-demand
export const fetchAndServeFile = async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    
    const repoOwner = process.env.REPO_OWNER;
    const repoName = process.env.REPO_NAME;
    const branch = process.env.BRANCH || "main";
    
    console.log(`[Fetch] Fetching file from GitHub: ${filePath}`);
    
    // Get file metadata to get download_url
    const metaUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;
    const metaRes = await axios.get(metaUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    // Download raw binary content
    const fileRes = await axios.get(metaRes.data.download_url, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(fileRes.data);
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];

    console.log(`[Fetch] Serving ${filePath} (${buffer.length} bytes)`);

    // Verify it's a valid PDF (should start with %PDF)
    if (buffer.slice(0, 4).toString('ascii') !== '%PDF') {
      console.error(`[Fetch] Invalid PDF file: ${filePath}`);
      return res.status(500).json({ 
        success: false, 
        message: "Invalid PDF file format." 
      });
    }

    // ✅ Send file as a binary PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("[Fetch Error]", err.message);
    
    if (err.response?.status === 404) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found in repository.",
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching file from GitHub.",
      error: err.message 
    });
  }
};