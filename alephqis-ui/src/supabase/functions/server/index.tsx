import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Initialize storage bucket for documents
async function initStorage() {
  const bucketName = "make-4ba5d8ce-documents";
  const { data: buckets } =
    await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(
    (bucket) => bucket.name === bucketName,
  );

  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
    });
    console.log("Created documents bucket with 5MB limit");
  }
}

// Initialize admin user if doesn't exist
async function initAdminUser() {
  try {
    const adminEmail = "admin@bitqis.com";
    const adminPassword = "admin123"; // Default password

    // Check if admin user exists
    const { data: existingUsers } =
      await supabase.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(
      (user) => user.email === adminEmail,
    );

    if (!adminExists) {
      console.log("========================================");
      console.log("👑 Creating admin user account...");

      const { data, error } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            isAdmin: true,
            name: "BitQIS Admin",
          },
        });

      if (error) {
        console.error(
          "❌ Failed to create admin user:",
          error.message,
        );
      } else {
        console.log("✅ Admin user created successfully");
        console.log("Email:", adminEmail);
        console.log("Default Password:", adminPassword);
        console.log("========================================");
      }
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

initStorage();
initAdminUser();

// Log email configuration on startup
console.log("========================================");
console.log("📧 EMAIL CONFIGURATION");
const contactEmailEnv = Deno.env.get("CONTACT_EMAIL");
// For Resend free tier, this MUST be the email address that owns the Resend account
const defaultContactEmail = "hamza.muhammad@dauphine.eu";
const actualContactEmail =
  contactEmailEnv || defaultContactEmail;
console.log(
  "Contact form emails will be sent to:",
  actualContactEmail,
);
if (!contactEmailEnv) {
  console.log(
    "✅ Using default email (Resend account owner - free tier compatible)",
  );
} else if (contactEmailEnv === defaultContactEmail) {
  console.log(
    "✅ CONTACT_EMAIL is set correctly for Resend free tier",
  );
} else {
  console.log(
    "⚠️ WARNING: CONTACT_EMAIL is set to",
    contactEmailEnv,
  );
  console.log("⚠️ This will FAIL on Resend free tier!");
  console.log(
    "⚠️ Free tier only allows sending to:",
    defaultContactEmail,
  );
  console.log("⚠️ Either:");
  console.log(
    "   1. Remove CONTACT_EMAIL env var (recommended - uses account email)",
  );
  console.log("   2. Set CONTACT_EMAIL=" + defaultContactEmail);
  console.log(
    "   3. Verify domain bitqis.com at resend.com/domains (for production)",
  );
}
console.log("========================================");

// ===== SEO ROUTES (Public - No Auth Required) =====

// Serve robots.txt with correct Content-Type
app.get("/make-server-4ba5d8ce/robots.txt", (c) => {
  const robotsContent = `# robots.txt pour BitQIS
# Permet l'indexation complète du site pour tous les moteurs de recherche

User-agent: *
Allow: /

# Pages à ne pas indexer (pages privées/authentification)
Disallow: /login
Disallow: /register
Disallow: /dashboard
Disallow: /admin
Disallow: /my-account

# Fichiers système à ne pas indexer
Disallow: /api/
Disallow: /*.json$
Disallow: /supabase/

# Sitemap pour faciliter l'indexation
Sitemap: https://bitqis.com/sitemap.xml

# Crawl-delay pour éviter la surcharge
Crawl-delay: 1

# Directives spécifiques pour les moteurs de recherche principaux
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1`;

  return c.text(robotsContent, 200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
});

// Serve sitemap.xml with correct Content-Type
app.get("/make-server-4ba5d8ce/sitemap.xml", (c) => {
  const today = new Date().toISOString().split("T")[0];

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Page d'accueil - Priorité maximale -->
  <url>
    <loc>https://bitqis.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Page de contact -->
  <url>
    <loc>https://bitqis.com/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

</urlset>`;

  return c.text(sitemapContent, 200, {
    "Content-Type": "application/xml; charset=utf-8",
  });
});

// ===== AUTH ROUTES =====

// Register new client
app.post("/make-server-4ba5d8ce/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
    } = body;

    if (!firstName || !lastName || !email || !password) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const existingUserId = await kv.get(
      `client:email:${email}`,
    );
    if (existingUserId) {
      return c.json(
        { error: "An account with this email already exists" },
        400,
      );
    }

    // Create user in Supabase Auth - email automatically confirmed
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Automatically confirm email
        user_metadata: {
          firstName,
          lastName,
          phone: phone || "",
          address: address || "",
        },
      });

    if (authError) {
      console.error("Auth registration error:", authError);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // ✅ Step 1: Create wallet automatically via Dynamic API (optional)
    let walletAddress = "pending";
    let dynamicUserId = "";

    // Only attempt wallet creation if Dynamic API key is configured
    const dynamicApiKey = Deno.env.get("DYNAMIC_API_KEY");
    if (dynamicApiKey) {
      try {
        const response = await fetch(
          "https://api.dynamic.xyz/api/v1/embedded-wallets",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${dynamicApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: email, // Use email as unique ID for Dynamic
              blockchain: "EVM",
            }),
          },
        );

        if (response.ok) {
          const walletData = await response.json();
          walletAddress = walletData.walletAddress || "pending";
          dynamicUserId = walletData.userId || "";
          console.log(
            "✅ Wallet created for user:",
            walletAddress,
          );
        } else {
          const err = await response.text();
          console.warn(
            "⚠️ Wallet creation failed (non-critical):",
            err,
          );
        }
      } catch (err) {
        // Wallet creation is optional - don't block registration
        console.warn(
          "⚠️ Wallet creation skipped (Dynamic API unavailable):",
          err instanceof Error ? err.message : String(err),
        );
      }
    } else {
      console.log(
        "ℹ️ Dynamic API key not configured - wallet creation skipped",
      );
    }

    // ✅ Step 2: Store profile in KV
    const clientProfile = {
      id: userId,
      firstName,
      lastName,
      email,
      phone: phone || "",
      address: address || "",
      walletAddress,
      dynamicUserId,
      status: "pending",
      kyc: "pending",
      cashBalance: 0,
      registrationDate: new Date().toISOString(),
      documents: [],
      availableFunds: [],
      investments: [],
    };

    await kv.set(`client:${userId}`, clientProfile);
    await kv.set(`client:email:${email}`, userId);

    console.log(
      "✅ Client registered successfully with wallet:",
      walletAddress,
    );

    return c.json({
      success: true,
      userId,
      walletAddress,
      message: "Registration successful. You can now log in.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Verify session endpoint
app.get("/make-server-4ba5d8ce/auth/verify", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];

    if (!accessToken) {
      return c.json(
        { error: "No authorization token provided" },
        401,
      );
    }

    // Verify user with access token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("Auth verification error:", authError);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const userId = user.id;
    const email = user.email;

    // Check if admin
    const isAdmin = email === "admin@bitqis.com";

    // Get user profile
    const profile = await kv.get(`client:${userId}`);

    if (!profile && !isAdmin) {
      return c.json({ error: "User profile not found" }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: userId,
        email: email,
        isAdmin: isAdmin,
        profile: profile,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    return c.json({ error: "Failed to verify session" }, 500);
  }
});

// Login
app.post("/make-server-4ba5d8ce/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    console.log("Login attempt for email:", email);

    // Check if admin - use Supabase Auth for admin too
    if (email === "admin@bitqis.com") {
      console.log("========================================");
      console.log("👑 Admin login attempt");

      // Try to authenticate with Supabase
      let authData = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login fails, try to create the admin user
      if (authData.error) {
        console.log(
          "⚠️ Admin auth failed, attempting to create admin user...",
        );
        console.log("Error:", authData.error.message);

        // Try to create admin user if it doesn't exist
        const createResult =
          await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              isAdmin: true,
              name: "BitQIS Admin",
            },
          });

        if (createResult.error) {
          console.error(
            "❌ Failed to create admin user:",
            createResult.error.message,
          );
          return c.json(
            {
              error: `Admin login failed. Please contact support. Details: ${createResult.error.message}`,
            },
            401,
          );
        }

        console.log(
          "✅ Admin user created, attempting login again...",
        );

        // Try to login again with the newly created user
        authData = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authData.error) {
          console.error(
            "❌ Admin login failed after creation:",
            authData.error.message,
          );
          return c.json(
            { error: "Admin authentication failed" },
            401,
          );
        }
      }

      console.log("✅ Admin authenticated successfully");
      console.log("Access token generated");
      console.log("========================================");

      return c.json({
        success: true,
        isAdmin: true,
        email,
        userId: authData.data.user.id,
        accessToken: authData.data.session.access_token,
      });
    }

    // Regular user login - use Supabase Auth
    console.log("Attempting regular user login...");
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error("Supabase auth login error:", error);

      // Check if user exists in our KV store but not in Supabase Auth
      const supabaseDb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { data: dbData } = await supabaseDb
        .from("kv_store_4ba5d8ce")
        .select("value")
        .eq("key", `client:email:${email}`)
        .maybeSingle();

      if (dbData) {
        console.error(
          "User exists in KV but Supabase Auth failed. This might be a password issue.",
        );
        return c.json(
          {
            error:
              "Invalid email or password. Please check your credentials and try again.",
          },
          401,
        );
      }

      return c.json(
        { error: "Invalid email or password" },
        401,
      );
    }

    const userId = data.user.id;
    console.log("Login successful for user:", userId);

    const clientProfile = await kv.get(`client:${userId}`);

    if (!clientProfile) {
      console.error(
        "User authenticated but profile not found in KV store",
      );
      return c.json(
        {
          error:
            "User profile not found. Please contact support.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      isAdmin: false,
      userId,
      accessToken: data.session.access_token,
      profile: clientProfile,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json(
      { error: "Login failed. Please try again." },
      500,
    );
  }
});

// ===== CLIENT ROUTES (Protected) =====

// Get client profile
app.get("/make-server-4ba5d8ce/client/profile", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await kv.get(`client:${user.id}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Update investments with current fund prices
    if (profile.investments && profile.investments.length > 0) {
      for (const investment of profile.investments) {
        const fund = await kv.get(`fund:${investment.fundId}`);
        if (fund) {
          const fundPrice =
            fund.currentPrice || fund.initialPrice || 0;
          if (fundPrice > 0 && investment.shares > 0) {
            investment.currentValue =
              investment.shares * fundPrice;
          }
        }
      }
    }

    return c.json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Upload document
app.post(
  "/make-server-4ba5d8ce/client/documents/upload",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const documentType = formData.get("type") as string;

      if (!file || !documentType) {
        return c.json(
          { error: "Missing file or document type" },
          400,
        );
      }

      // Upload to Supabase Storage
      const fileName = `${user.id}/${documentType}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("make-4ba5d8ce-documents")
          .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return c.json({ error: "Upload failed" }, 500);
      }

      // Update client profile with document info
      const profile = await kv.get(`client:${user.id}`);
      const document = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: documentType,
        uploadDate: new Date().toISOString(),
        size: file.size,
        storagePath: fileName,
      };

      profile.documents = profile.documents || [];
      profile.documents.push(document);
      await kv.set(`client:${user.id}`, profile);

      return c.json({ success: true, document });
    } catch (error) {
      console.error("Document upload error:", error);
      return c.json({ error: "Upload failed" }, 500);
    }
  },
);

// Get document signed URL
app.get(
  "/make-server-4ba5d8ce/client/documents/:documentId/url",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const documentId = c.req.param("documentId");
      const profile = await kv.get(`client:${user.id}`);

      const document = profile.documents?.find(
        (d: any) => d.id === documentId,
      );
      if (!document) {
        return c.json({ error: "Document not found" }, 404);
      }

      const { data: signedUrl } = await supabase.storage
        .from("make-4ba5d8ce-documents")
        .createSignedUrl(document.storagePath, 3600); // 1 hour expiry

      return c.json({
        success: true,
        url: signedUrl?.signedUrl,
      });
    } catch (error) {
      console.error("Error getting document URL:", error);
      return c.json(
        { error: "Failed to get document URL" },
        500,
      );
    }
  },
);

// ===== ADMIN ROUTES (Protected) =====

// Get all clients
app.get("/make-server-4ba5d8ce/admin/clients", async (c) => {
  try {
    // In production, verify admin token here
    console.log("Fetching all clients...");

    // Use raw Supabase query to get both key and value
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("kv_store_4ba5d8ce")
      .select("key, value")
      .like("key", "client:%");

    if (error) {
      console.error("Database error:", error);
      return c.json(
        { error: "Failed to fetch clients from database" },
        500,
      );
    }

    console.log(
      "Raw database results:",
      JSON.stringify(data, null, 2),
    );

    // Filter out email mapping keys - only keep actual client profiles
    const clients = (data || [])
      .filter((item: any) => {
        if (!item || typeof item.key !== "string") {
          console.log("Invalid item:", item);
          return false;
        }
        const isEmailMapping = item.key.includes(":email:");
        console.log(
          "Key:",
          item.key,
          "Is email mapping:",
          isEmailMapping,
        );
        return !isEmailMapping;
      })
      .map((item: any) => item.value)
      .filter(
        (value: any) => value !== null && value !== undefined,
      );

    console.log("Filtered clients count:", clients.length);
    console.log(
      "Filtered clients:",
      JSON.stringify(clients, null, 2),
    );
    return c.json({ success: true, clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

// Get specific client (admin)
app.get(
  "/make-server-4ba5d8ce/admin/clients/:clientId",
  async (c) => {
    try {
      const clientId = c.req.param("clientId");
      const profile = await kv.get(`client:${clientId}`);

      if (!profile) {
        return c.json({ error: "Client not found" }, 404);
      }

      // Update investments with current fund prices
      if (
        profile.investments &&
        profile.investments.length > 0
      ) {
        for (const investment of profile.investments) {
          const fund = await kv.get(
            `fund:${investment.fundId}`,
          );
          if (fund && fund.currentPrice) {
            investment.currentValue =
              investment.shares * fund.currentPrice;
          }
        }
      }

      return c.json({ success: true, client: profile });
    } catch (error) {
      console.error("Error fetching client:", error);
      return c.json({ error: "Failed to fetch client" }, 500);
    }
  },
);

// Get client document signed URL (admin)
app.get(
  "/make-server-4ba5d8ce/admin/clients/:clientId/documents/:documentId/url",
  async (c) => {
    try {
      const clientId = c.req.param("clientId");
      const documentId = c.req.param("documentId");

      const profile = await kv.get(`client:${clientId}`);
      if (!profile) {
        return c.json({ error: "Client not found" }, 404);
      }

      const document = profile.documents?.find(
        (d: any) => d.id === documentId,
      );
      if (!document) {
        return c.json({ error: "Document not found" }, 404);
      }

      const { data: signedUrl } = await supabase.storage
        .from("make-4ba5d8ce-documents")
        .createSignedUrl(document.storagePath, 3600);

      return c.json({
        success: true,
        url: signedUrl?.signedUrl,
      });
    } catch (error) {
      console.error("Error getting document URL:", error);
      return c.json(
        { error: "Failed to get document URL" },
        500,
      );
    }
  },
);

// Update client status (admin)
app.patch(
  "/make-server-4ba5d8ce/admin/clients/:clientId/status",
  async (c) => {
    try {
      const clientId = c.req.param("clientId");
      const { status, kyc } = await c.req.json();

      const profile = await kv.get(`client:${clientId}`);
      if (!profile) {
        return c.json({ error: "Client not found" }, 404);
      }

      if (status) profile.status = status;
      if (kyc) profile.kyc = kyc;

      await kv.set(`client:${clientId}`, profile);

      return c.json({ success: true, client: profile });
    } catch (error) {
      console.error("Error updating client status:", error);
      return c.json({ error: "Failed to update status" }, 500);
    }
  },
);

// Grant fund access to client (admin)
app.post(
  "/make-server-4ba5d8ce/admin/clients/:clientId/funds",
  async (c) => {
    try {
      const clientId = c.req.param("clientId");
      const { fundId } = await c.req.json();

      console.log(
        `Granting fund ${fundId} access to client ${clientId}`,
      );

      const profile = await kv.get(`client:${clientId}`);
      if (!profile) {
        console.error("Client not found:", clientId);
        return c.json({ error: "Client not found" }, 404);
      }

      // Verify the fund exists
      const fund = await kv.get(`fund:${fundId}`);
      if (!fund) {
        console.error("Fund not found:", fundId);
        return c.json({ error: "Fund not found" }, 404);
      }

      profile.availableFunds = profile.availableFunds || [];
      if (!profile.availableFunds.includes(fundId)) {
        profile.availableFunds.push(fundId);
        await kv.set(`client:${clientId}`, profile);
        console.log(
          `Successfully granted fund ${fundId} to client ${clientId}`,
        );
        console.log(
          "Updated availableFunds:",
          profile.availableFunds,
        );
      } else {
        console.log(
          `Client ${clientId} already has access to fund ${fundId}`,
        );
      }

      return c.json({ success: true, client: profile });
    } catch (error) {
      console.error("Error granting fund access:", error);
      return c.json(
        { error: "Failed to grant fund access" },
        500,
      );
    }
  },
);

// ===== FUND ROUTES =====

// Create fund (admin)
app.post("/make-server-4ba5d8ce/admin/funds", async (c) => {
  try {
    const fundData = await c.req.json();
    console.log("========================================");
    console.log(
      "📊 Creating fund with data:",
      JSON.stringify(fundData, null, 2),
    );

    const fundId = fundData.fundId || `fund_${Date.now()}`;

    // Parse and validate initial price
    const initialPrice = parseFloat(fundData.initialPrice);
    if (isNaN(initialPrice) || initialPrice <= 0) {
      console.error(
        "❌ Invalid initial price:",
        fundData.initialPrice,
      );
      return c.json(
        {
          error:
            "Invalid initial price. Must be a positive number.",
        },
        400,
      );
    }

    const fund = {
      id: fundId,
      name: fundData.name,
      symbol: fundData.symbol,
      description: fundData.description || "",
      strategy: fundData.strategy || "",
      currentPrice: initialPrice,
      initialPrice: initialPrice,
      change24h: 0,
      priceHistory: [],
      createdAt: fundData.createdAt || new Date().toISOString(),
    };

    console.log("Storing fund with key:", `fund:${fundId}`);
    console.log("Fund object:", JSON.stringify(fund, null, 2));

    await kv.set(`fund:${fundId}`, fund);

    // Verify it was stored
    const storedFund = await kv.get(`fund:${fundId}`);
    console.log("✅ Fund created and verified:", fundId);
    console.log(
      "Stored fund currentPrice:",
      storedFund?.currentPrice,
    );
    console.log(
      "Stored fund initialPrice:",
      storedFund?.initialPrice,
    );
    console.log("========================================");

    return c.json({ success: true, fund: storedFund || fund });
  } catch (error) {
    console.error("❌ Error creating fund:", error);
    return c.json({ error: "Failed to create fund" }, 500);
  }
});

// Update fund price (Admin only)
app.put(
  "/make-server-4ba5d8ce/admin/funds/:fundId/price",
  async (c) => {
    try {
      console.log("========================================");
      console.log("📊 Fund Price Update Request");

      const authHeader = c.req.header("Authorization");
      console.log("Auth header present:", !!authHeader);

      if (!authHeader) {
        console.error("❌ No Authorization header");
        return c.json(
          { error: "No authorization token provided" },
          401,
        );
      }

      const accessToken = authHeader.split(" ")[1];
      console.log("Access token extracted:", !!accessToken);

      if (!accessToken) {
        console.error("❌ Invalid Authorization header format");
        return c.json(
          { error: "Invalid authorization header" },
          401,
        );
      }

      console.log("Verifying user with Supabase auth...");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(accessToken);

      console.log(
        "Auth result - User:",
        user?.email,
        "Error:",
        authError?.message,
      );

      if (authError || !user) {
        console.error(
          "❌ Authentication failed:",
          authError?.message,
        );
        return c.json(
          {
            error:
              "Authentication failed. Please log in again.",
          },
          401,
        );
      }

      if (user.email !== "admin@bitqis.com") {
        console.error("❌ User is not admin:", user.email);
        return c.json(
          { error: "Only admin can update fund prices" },
          403,
        );
      }

      console.log("✅ Admin authenticated:", user.email);

      const fundId = c.req.param("fundId");
      const { newPrice } = await c.req.json();

      console.log(
        "Updating fund:",
        fundId,
        "to price:",
        newPrice,
      );

      if (!newPrice || newPrice <= 0) {
        return c.json({ error: "Invalid price" }, 400);
      }

      const fund = await kv.get(`fund:${fundId}`);
      if (!fund) {
        console.error("❌ Fund not found:", fundId);
        return c.json({ error: "Fund not found" }, 404);
      }

      console.log(
        "Current fund data:",
        JSON.stringify(fund, null, 2),
      );

      // Initialize priceHistory if it doesn't exist
      if (!fund.priceHistory) {
        fund.priceHistory = [];
      }

      // Update current price and calculate 24h change
      const oldPrice = fund.currentPrice || fund.initialPrice;
      fund.currentPrice = parseFloat(newPrice);
      fund.change24h =
        oldPrice > 0
          ? ((fund.currentPrice - oldPrice) / oldPrice) * 100
          : 0;

      // Add NEW price to history (not the old one)
      fund.priceHistory.push({
        price: fund.currentPrice,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 100 price history entries to prevent bloat
      if (fund.priceHistory.length > 100) {
        fund.priceHistory = fund.priceHistory.slice(-100);
      }

      // Save updated fund
      await kv.set(`fund:${fundId}`, fund);

      console.log(
        `✅ Updated fund ${fundId} price from ${oldPrice} to ${fund.currentPrice}`,
      );
      console.log("Change: ${fund.change24h.toFixed(2)}%");
      console.log("========================================");

      return c.json({
        success: true,
        fund,
        priceChange: {
          oldPrice,
          newPrice: fund.currentPrice,
          changePercent: fund.change24h,
        },
      });
    } catch (error) {
      console.error("Error updating fund price:", error);
      return c.json(
        { error: "Failed to update fund price" },
        500,
      );
    }
  },
);

// Get all funds
app.get("/make-server-4ba5d8ce/funds", async (c) => {
  try {
    console.log("========================================");
    console.log("📊 Fetching all funds...");

    // Use raw Supabase query to get both key and value
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("kv_store_4ba5d8ce")
      .select("key, value")
      .like("key", "fund:%");

    if (error) {
      console.error("❌ Database error:", error);
      return c.json(
        { error: "Failed to fetch funds from database" },
        500,
      );
    }

    console.log(
      "Raw fund data from DB:",
      JSON.stringify(data, null, 2),
    );

    const funds = (data || [])
      .map((item: any) => {
        const fund = item.value;
        console.log(
          "Processing fund:",
          fund?.id,
          "currentPrice:",
          fund?.currentPrice,
          "initialPrice:",
          fund?.initialPrice,
        );
        return fund;
      })
      .filter(
        (value: any) => value !== null && value !== undefined,
      );

    console.log("✅ Processed funds:", funds.length);
    funds.forEach((fund: any) => {
      console.log(
        `  - ${fund.name} (${fund.symbol}): ${fund.currentPrice}`,
      );
    });
    console.log("========================================");

    return c.json({ success: true, funds });
  } catch (error) {
    console.error("❌ Error fetching funds:", error);
    return c.json({ error: "Failed to fetch funds" }, 500);
  }
});

// Debug endpoint - list all KV keys
app.get("/make-server-4ba5d8ce/debug/keys", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("kv_store_4ba5d8ce")
      .select("key, value");

    if (error) {
      console.error("Database error:", error);
      return c.json({ error: "Failed to fetch keys" }, 500);
    }

    console.log(
      "Debug: Raw database response:",
      JSON.stringify(data, null, 2),
    );

    const keyList = (data || []).map((item: any) => ({
      key: item.key,
      hasValue: !!item.value,
      valueType: typeof item.value,
    }));

    return c.json({
      success: true,
      keys: keyList,
      count: keyList.length,
    });
  } catch (error) {
    console.error("Error fetching keys:", error);
    return c.json({ error: "Failed to fetch keys" }, 500);
  }
});

// Admin deposit money to client
app.post(
  "/make-server-4ba5d8ce/admin/clients/:clientId/deposit",
  async (c) => {
    try {
      const clientId = c.req.param("clientId");
      const { amount, note } = await c.req.json();

      if (!amount || amount <= 0) {
        return c.json({ error: "Invalid amount" }, 400);
      }

      const profile = await kv.get(`client:${clientId}`);
      if (!profile) {
        return c.json({ error: "Client not found" }, 404);
      }

      // Create transaction record
      const transaction = {
        id: `txn_${Date.now()}`,
        type: "deposit",
        amount: parseFloat(amount),
        note: note || "",
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      // Update client balance
      profile.cashBalance =
        (profile.cashBalance || 0) + parseFloat(amount);
      profile.transactions = profile.transactions || [];
      profile.transactions.unshift(transaction); // Add to beginning

      await kv.set(`client:${clientId}`, profile);

      console.log(
        `✅ Deposited ${amount} to client ${clientId}`,
      );

      return c.json({
        success: true,
        transaction,
        newBalance: profile.cashBalance,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      return c.json({ error: "Failed to deposit funds" }, 500);
    }
  },
);

// Client trade (buy/sell fund shares)
app.post("/make-server-4ba5d8ce/client/trade", async (c) => {
  try {
    const accessToken = c.req
      .header("Authorization")
      ?.split(" ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { fundId, action, shares } = await c.req.json();

    if (!fundId || !action || !shares || shares <= 0) {
      return c.json({ error: "Invalid trade parameters" }, 400);
    }

    // Get client profile
    const profile = await kv.get(`client:${user.id}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Get fund details
    const fund = await kv.get(`fund:${fundId}`);
    if (!fund) {
      return c.json({ error: "Fund not found" }, 404);
    }

    // Ensure fund has a valid price
    const fundPrice =
      fund.currentPrice || fund.initialPrice || 0;
    if (fundPrice <= 0) {
      console.error(
        "Invalid fund price for fund:",
        fundId,
        fund,
      );
      return c.json({ error: "Fund price not available" }, 500);
    }

    const tradeAmount = parseFloat(shares) * fundPrice;

    if (action === "buy") {
      // Check if client has enough cash
      if (profile.cashBalance < tradeAmount) {
        return c.json(
          { error: "Insufficient cash balance" },
          400,
        );
      }

      // Deduct cash
      profile.cashBalance -= tradeAmount;

      // Update investments
      profile.investments = profile.investments || [];
      const existingInvestment = profile.investments.find(
        (inv: any) => inv.fundId === fundId,
      );

      if (existingInvestment) {
        // Update existing position
        const totalShares =
          existingInvestment.shares + parseFloat(shares);
        const totalCost =
          existingInvestment.shares *
            existingInvestment.averagePrice +
          tradeAmount;
        existingInvestment.shares = totalShares;
        existingInvestment.averagePrice =
          totalCost / totalShares;
        existingInvestment.currentValue =
          totalShares * fundPrice;
      } else {
        // Create new position
        profile.investments.push({
          fundId: fund.id,
          fundName: fund.name,
          fundSymbol: fund.symbol,
          shares: parseFloat(shares),
          averagePrice: fundPrice,
          currentValue: tradeAmount,
        });
      }

      // Create transaction record
      const transaction = {
        id: `txn_${Date.now()}`,
        type: "buy",
        fundId: fund.id,
        fundName: fund.name,
        fundSymbol: fund.symbol,
        shares: parseFloat(shares),
        pricePerShare: fundPrice,
        amount: tradeAmount,
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      profile.transactions = profile.transactions || [];
      profile.transactions.unshift(transaction);

      // Track portfolio value history
      const portfolioValue = profile.investments.reduce(
        (sum: number, inv: any) => {
          return sum + (inv.currentValue || 0);
        },
        0,
      );

      profile.portfolioHistory = profile.portfolioHistory || [];
      profile.portfolioHistory.push({
        timestamp: new Date().toISOString(),
        value: portfolioValue,
      });

      // Keep only last 100 entries to prevent bloat
      if (profile.portfolioHistory.length > 100) {
        profile.portfolioHistory =
          profile.portfolioHistory.slice(-100);
      }

      await kv.set(`client:${user.id}`, profile);

      console.log(
        `✅ Client ${user.id} bought ${shares} shares of ${fund.symbol} for ${tradeAmount}`,
      );

      return c.json({
        success: true,
        transaction,
        newBalance: profile.cashBalance,
        investment:
          existingInvestment ||
          profile.investments[profile.investments.length - 1],
      });
    } else if (action === "sell") {
      // Find investment
      profile.investments = profile.investments || [];
      const investment = profile.investments.find(
        (inv: any) => inv.fundId === fundId,
      );

      if (!investment) {
        return c.json(
          { error: "No position in this fund" },
          400,
        );
      }

      if (investment.shares < parseFloat(shares)) {
        return c.json(
          {
            error: `Insufficient shares. You own ${investment.shares} shares.`,
          },
          400,
        );
      }

      // Add cash from sale
      profile.cashBalance += tradeAmount;

      // Update or remove investment
      investment.shares -= parseFloat(shares);

      if (investment.shares === 0) {
        // Remove investment if no shares left
        profile.investments = profile.investments.filter(
          (inv: any) => inv.fundId !== fundId,
        );
      } else {
        investment.currentValue = investment.shares * fundPrice;
      }

      // Create transaction record
      const transaction = {
        id: `txn_${Date.now()}`,
        type: "sell",
        fundId: fund.id,
        fundName: fund.name,
        fundSymbol: fund.symbol,
        shares: parseFloat(shares),
        pricePerShare: fundPrice,
        amount: tradeAmount,
        timestamp: new Date().toISOString(),
        status: "completed",
      };

      profile.transactions = profile.transactions || [];
      profile.transactions.unshift(transaction);

      // Track portfolio value history
      const portfolioValue = profile.investments.reduce(
        (sum: number, inv: any) => {
          return sum + (inv.currentValue || 0);
        },
        0,
      );

      profile.portfolioHistory = profile.portfolioHistory || [];
      profile.portfolioHistory.push({
        timestamp: new Date().toISOString(),
        value: portfolioValue,
      });

      // Keep only last 100 entries to prevent bloat
      if (profile.portfolioHistory.length > 100) {
        profile.portfolioHistory =
          profile.portfolioHistory.slice(-100);
      }

      await kv.set(`client:${user.id}`, profile);

      console.log(
        `✅ Client ${user.id} sold ${shares} shares of ${fund.symbol} for ${tradeAmount}`,
      );

      return c.json({
        success: true,
        transaction,
        newBalance: profile.cashBalance,
        investment: investment.shares > 0 ? investment : null,
      });
    } else {
      return c.json(
        { error: 'Invalid action. Use "buy" or "sell"' },
        400,
      );
    }
  } catch (error) {
    console.error("Trade error:", error);
    return c.json({ error: "Failed to execute trade" }, 500);
  }
});

// Get client transactions
app.get(
  "/make-server-4ba5d8ce/client/transactions",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (!user || error) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const profile = await kv.get(`client:${user.id}`);
      if (!profile) {
        return c.json({ error: "Profile not found" }, 404);
      }

      const transactions = profile.transactions || [];

      return c.json({ success: true, transactions });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return c.json(
        { error: "Failed to fetch transactions" },
        500,
      );
    }
  },
);

// Contact form submission
app.post("/make-server-4ba5d8ce/contact", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, company, message } =
      body;

    if (!firstName || !lastName || !email || !message) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const contactId = `contact_${Date.now()}`;
    const contact = {
      id: contactId,
      firstName,
      lastName,
      email,
      company: company || "Not provided",
      message,
      submittedAt: new Date().toISOString(),
      status: "received",
    };

    // Store in KV for record keeping
    await kv.set(contactId, contact);
    console.log("Contact form submitted:", contact);

    // Send email notification via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && resendApiKey.startsWith("re_")) {
      try {
        // Get recipient email from environment variable or use default
        // Email contact@bitqis.com has been verified in Resend Audiences
        const recipientEmail =
          Deno.env.get("CONTACT_EMAIL") || "contact@bitqis.com";

        console.log("========================================");
        console.log("📧 Sending contact form notification...");
        console.log(
          "From:",
          `${firstName} ${lastName} <${email}>`,
        );
        console.log("To:", recipientEmail);
        console.log(
          "CONTACT_EMAIL env var:",
          Deno.env.get("CONTACT_EMAIL")
            ? "SET"
            : "NOT SET (using default)",
        );
        console.log("========================================");

        const emailResponse = await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "BitQIS Contact <contact@bitqis.com>",
              to: [recipientEmail],
              reply_to: email, // Allow replying directly to the sender
              subject: `BitQIS Contact Form - ${firstName} ${lastName}`,
              html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1f36; border-bottom: 2px solid #4169e1; padding-bottom: 10px;">New Contact Form Submission</h2>
                
                <div style="background: #f8f9fb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
                  <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #4169e1;">${email}</a></p>
                  <p style="margin: 10px 0;"><strong>Company:</strong> ${company || "Not provided"}</p>
                  <p style="margin: 10px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="margin: 20px 0;">
                  <h3 style="color: #1a1f36;">Message:</h3>
                  <div style="background: white; padding: 15px; border-left: 4px solid #4169e1; border-radius: 4px;">
                    ${message.replace(/\n/g, "<br>")}
                  </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e8eaed; padding-top: 20px;">
                  This email was sent from the BitQIS contact form.
                </p>
              </div>
            `,
            }),
          },
        );

        const responseData = await emailResponse.json();

        if (emailResponse.ok) {
          console.log(
            "========================================",
          );
          console.log(
            `✅ Email notification sent successfully!`,
          );
          console.log("Recipient:", recipientEmail);
          console.log("Email ID:", responseData.id);
          console.log(
            "========================================",
          );
          contact.status = "sent";
          contact.emailId = responseData.id;
          await kv.set(contactId, contact);
        } else {
          console.error(
            "❌ Failed to send email:",
            JSON.stringify(responseData),
          );
          console.error(
            "Response status:",
            emailResponse.status,
          );

          // Check if it's a domain verification error or testing restriction
          if (
            responseData.message?.includes("testing emails") ||
            responseData.message?.includes("verify a domain")
          ) {
            console.error("");
            console.error(
              "========================================",
            );
            console.error("⚠️ RESEND DOMAIN SETUP REQUIRED:");
            console.error("");
            console.error(
              "Resend free tier only allows sending to your account email.",
            );
            console.error(
              "Current Resend account email: hamza.muhammad@dauphine.eu",
            );
            console.error("");
            console.error(
              "To send to contact@bitqis.com or other emails, you need to:",
            );
            console.error("");
            console.error(
              "OPTION 1 - Verify a Custom Domain (Recommended for Production):",
            );
            console.error(
              "1. Go to: https://resend.com/domains",
            );
            console.error("2. Add your domain (bitqis.com)");
            console.error(
              "3. Add the DNS records shown to your domain provider:",
            );
            console.error("   - SPF record (TXT)");
            console.error("   - DKIM record (TXT)");
            console.error("   - DMARC record (TXT - optional)");
            console.error(
              "4. Wait for verification (usually 5-30 minutes)",
            );
            console.error(
              "5. Update from address to: contact@bitqis.com",
            );
            console.error("");
            console.error(
              "OPTION 2 - For Testing (Current Setup):",
            );
            console.error(
              "Emails will be sent to: hamza.muhammad@dauphine.eu",
            );
            console.error(
              "This is the Resend account owner email (free tier compatible)",
            );
            console.error(
              "No additional setup needed for testing",
            );
            console.error("");
            console.error("OPTION 3 - Upgrade to Resend Pro:");
            console.error(
              "Send to any email without domain verification",
            );
            console.error("Cost: Starting at $20/month");
            console.error(
              "========================================",
            );
            console.error("");
          } else if (
            responseData.message?.includes("not in audience") ||
            responseData.message?.includes("verify")
          ) {
            console.error("");
            console.error(
              "========================================",
            );
            console.error("⚠️ RESEND EMAIL SETUP REQUIRED:");
            console.error("");
            console.error(
              "Your Resend account needs to verify the recipient email address.",
            );
            console.error("");
            console.error("STEPS TO FIX:");
            console.error(
              "1. Go to: https://resend.com/audiences",
            );
            console.error(
              "2. Add email and verify it via confirmation link",
            );
            console.error(
              "3. OR set CONTACT_EMAIL environment variable to a verified email",
            );
            console.error(
              "========================================",
            );
            console.error("");
          }

          contact.status = "email_failed";
          contact.emailError = responseData.message;
          await kv.set(contactId, contact);
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        contact.status = "email_error";
        contact.emailError = emailError.message;
        await kv.set(contactId, contact);
      }
    } else {
      console.log(
        "ℹ️ Contact form submission stored (email notifications disabled)",
      );
      contact.status = "stored";
      await kv.set(contactId, contact);
    }

    return c.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Test email endpoint to verify Resend configuration
app.post("/make-server-4ba5d8ce/test-email", async (c) => {
  try {
    const body = await c.req.json();
    const requestedEmail = body.testEmail;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return c.json(
        {
          error: "RESEND_API_KEY not configured",
          details:
            "Please set the RESEND_API_KEY environment variable",
        },
        500,
      );
    }

    if (!resendApiKey.startsWith("re_")) {
      return c.json(
        {
          error: "Invalid RESEND_API_KEY format",
          details: 'API key should start with "re_"',
        },
        500,
      );
    }

    // Use CONTACT_EMAIL environment variable or default to account owner email
    const configuredEmail =
      Deno.env.get("CONTACT_EMAIL") ||
      "hamza.muhammad@dauphine.eu";
    const emailToTest = requestedEmail || configuredEmail;

    console.log("========================================");
    console.log("📧 Testing email configuration...");
    console.log("Configured recipient:", configuredEmail);
    console.log("Testing with:", emailToTest);
    console.log(
      "API Key prefix:",
      resendApiKey.substring(0, 10) + "...",
    );

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BitQIS Test <contact@bitqis.com>",
          to: [emailToTest],
          subject: "Test Email from BitQIS",
          html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4169e1;">✅ Email Configuration Test</h2>
            <p>This is a test email from your BitQIS application.</p>
            <p>If you received this email, your Resend integration is working correctly!</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8eaed;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        `,
        }),
      },
    );

    const responseData = await emailResponse.json();
    console.log("Response status:", emailResponse.status);
    console.log(
      "Response data:",
      JSON.stringify(responseData, null, 2),
    );

    if (emailResponse.ok) {
      console.log("✅ Test email sent successfully!");
      console.log("Email ID:", responseData.id);
      console.log("========================================");
      return c.json({
        success: true,
        message: "Test email sent successfully",
        emailId: responseData.id,
        recipient: emailToTest,
      });
    } else {
      console.error("❌ Failed to send test email");
      console.error(
        "Error:",
        JSON.stringify(responseData, null, 2),
      );
      console.log("========================================");

      // Generate specific suggestions based on error
      const suggestions = [];

      if (
        responseData.message?.includes("testing emails") ||
        responseData.message?.includes("verify a domain")
      ) {
        suggestions.push(
          "🔧 RESEND FREE TIER LIMITATION DETECTED",
          "",
          "For free tier, emails can only be sent to: hamza.muhammad@dauphine.eu",
          "",
          "To send to contact@bitqis.com or other emails:",
          "",
          "📌 OPTION 1 - Verify Your Domain (Recommended):",
          "  1. Go to https://resend.com/domains",
          "  2. Add bitqis.com as your domain",
          "  3. Add the DNS records to your domain provider",
          "  4. Wait for verification (~5 minutes)",
          "  5. Change from address to: contact@bitqis.com",
          "",
          "📌 OPTION 2 - For Testing Now:",
          "  • Keep sending to hamza.muhammad@dauphine.eu",
          "  • Set CONTACT_EMAIL=hamza.muhammad@dauphine.eu in environment",
          "",
          "📌 OPTION 3 - Upgrade Account:",
          "  • Upgrade to Resend Pro to send to any email",
        );
      } else if (
        responseData.message?.includes("not in audience")
      ) {
        suggestions.push(
          "Visit https://resend.com/audiences",
          `Add ${emailToTest} to your audience`,
          "Click the verification link sent to that email",
          "Wait a few minutes, then test again",
        );
      } else {
        suggestions.push(
          "Check your Resend API key is valid",
          "Verify your domain at https://resend.com/domains",
          "Ensure DNS records are properly configured",
        );
      }

      return c.json(
        {
          success: false,
          error: "Failed to send test email",
          details: responseData,
          configuredRecipient: configuredEmail,
          suggestions,
        },
        400,
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return c.json(
      {
        error: "Test email failed",
        details: error.message,
      },
      500,
    );
  }
});

// Get current email configuration (diagnostic endpoint)
app.get("/make-server-4ba5d8ce/email-config", async (c) => {
  const contactEmail = Deno.env.get("CONTACT_EMAIL");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const defaultEmail = "hamza.muhammad@dauphine.eu";

  return c.json({
    success: true,
    configuration: {
      contactEmail: contactEmail || defaultEmail,
      isDefault: !contactEmail,
      hasResendApiKey:
        !!resendApiKey && resendApiKey.startsWith("re_"),
      recommendation: !contactEmail
        ? `Using default email (${defaultEmail}) - works with Resend free tier`
        : contactEmail === defaultEmail
          ? `Using ${defaultEmail} - works with Resend free tier`
          : `Using ${contactEmail} - requires verified domain or will fail on free tier`,
    },
  });
});

// Client endpoint to update wallet address after connecting via Dynamic SDK
app.post(
  "/make-server-4ba5d8ce/client/update-wallet",
  async (c) => {
    try {
      const accessToken = c.req
        .header("Authorization")
        ?.split(" ")[1];

      if (!accessToken) {
        return c.json(
          { error: "No authorization token provided" },
          401,
        );
      }

      // Verify user with access token
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(accessToken);

      if (authError || !user) {
        console.error("Auth error:", authError);
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userId = user.id;
      const { walletAddress, dynamicUserId } =
        await c.req.json();

      if (!walletAddress) {
        return c.json(
          { error: "Wallet address is required" },
          400,
        );
      }

      console.log("========================================");
      console.log("Updating wallet address for user:", userId);
      console.log("Wallet address:", walletAddress);
      console.log("Dynamic User ID:", dynamicUserId);

      // Get user profile
      const profile = await kv.get(`client:${userId}`);
      if (!profile) {
        return c.json({ error: "User profile not found" }, 404);
      }

      // Update wallet address
      profile.walletAddress = walletAddress;
      if (dynamicUserId) {
        profile.dynamicUserId = dynamicUserId;
      }

      await kv.set(`client:${userId}`, profile);

      console.log("✅ Wallet address updated successfully");
      console.log("========================================");

      return c.json({
        success: true,
        message: "Wallet address updated successfully",
        walletAddress,
      });
    } catch (error) {
      console.error("Update wallet error:", error);
      return c.json(
        { error: "Failed to update wallet address" },
        500,
      );
    }
  },
);

// Admin endpoint to create wallet for existing user (deprecated - use Dynamic SDK frontend)
app.post(
  "/make-server-4ba5d8ce/admin/create-wallet/:userId",
  async (c) => {
    try {
      const userId = c.req.param("userId");
      console.log(
        "Admin wallet creation request for user:",
        userId,
      );

      // Get user profile
      const profile = await kv.get(`client:${userId}`);
      if (!profile) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if wallet already exists
      if (
        profile.walletAddress &&
        profile.walletAddress !== "pending"
      ) {
        return c.json({
          success: true,
          message: "Wallet already exists",
          walletAddress: profile.walletAddress,
        });
      }

      // Note: This endpoint is deprecated. Wallet creation should happen via Dynamic SDK on frontend
      // This is kept for backward compatibility

      console.log("========================================");
      console.log(
        "⚠️ Admin wallet creation endpoint called (deprecated)",
      );
      console.log("User ID:", userId);
      console.log(
        "💡 Recommend using Dynamic SDK on frontend instead",
      );
      console.log("========================================");

      return c.json(
        {
          success: false,
          error:
            "Manual wallet creation is deprecated. User should connect wallet via Dynamic SDK in their dashboard.",
          message:
            'Please ask the user to connect their wallet using the "Connect Wallet" button in their dashboard.',
        },
        400,
      );
    } catch (error) {
      console.error("Admin wallet creation error:", error);
      return c.json(
        {
          error: "Wallet creation failed",
          details: error.message,
        },
        500,
      );
    }
  },
);

export default {
  fetch: app.fetch,
};

Deno.serve(app.fetch);