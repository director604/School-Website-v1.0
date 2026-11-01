# Security Specification: Ban Naree School Portal

## 1. Data Invariants
1. School public data (`school_info`, `staff`, `board_members`, `news`, `gallery`) can be viewed publicly by any visitor.
2. Only verified authenticated staff (`teacher` or `admin`) can publish news or albums.
3. Only authenticated `admin` users can edit core organizational details (`school_info`), manage staff directory, manage board members, and assign user roles.
4. User role elevation (`role: 'admin'`) cannot be self-assigned; verified against `/admins/$(request.auth.uid)` document.
5. Content authors cannot forge other user IDs (`authorId` must match `request.auth.uid`).
6. User profiles in `/users/{userId}` can only be updated by the owner (for display name/photo) or by an admin (for role/status changes).

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Admin Claim**: Anonymous user trying to write to `/admins/attacker123`.
2. **Self-Promotion to Admin**: A teacher user trying to patch their own `/users/{uid}` with `role: "admin"`.
3. **Ghost Field Injection**: Adding an undocumented `__adminToken: true` inside a `/news` document creation.
4. **Author Spoofing**: User A creating a news item with `authorId: "user_B"`.
5. **Junk ID Poisoning**: Trying to create a document with a 2KB junk string as document ID.
6. **Negative or Overflow Payload Attack**: Injecting a 2MB string into `title` or `content`.
7. **Read PII of Other Staff Privately**: Unauthorized user querying private fields.
8. **Direct SchoolInfo Modification by Anonymous User**: Guest attempting to overwrite school history or director message.
9. **Staff Directory Deletion by Regular User**: Unauthenticated or non-admin attempting to delete a teacher from `/staff`.
10. **Board Member Role Corruption**: Regular visitor posting a malicious payload to `/board_members`.
11. **Gallery Image Array Overflow**: Uploading an array of 5,000 image links to `/gallery/{id}` to cause wallet denial.
12. **Tampering with Admin Lookup Collection**: Non-admin attempting to delete existing admin records from `/admins`.

## 3. Test Runner Specification
`firestore.rules.test.ts` outlines test cases validating that all twelve payloads receive `PERMISSION_DENIED`.
