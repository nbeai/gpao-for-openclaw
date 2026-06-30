# Non-Developer Product Translation

Use this when the user is a vibe coder or non-developer describing an app, web service, tool, dashboard, or automation in natural language.

## Goal

Convert vague intent into a buildable, testable, low-risk first version without making the user learn software engineering jargon.

## Translation Steps

### 1. Restate The Intent

Use plain language:

```text
제가 이해한 목표는 이것입니다:
누가:
무엇을:
왜:
결과로 무엇을 얻는가:
```

### 2. Pick The Product Shape

Infer the likely shape:

- Website: information, brand, portfolio, sales page.
- Web app: user enters/edits data and receives a result.
- Dashboard: repeated monitoring, comparison, status, operations.
- Internal tool: private workflow for a person/team.
- Automation: repeated task after manual workflow is proven.
- Plugin/skill: improves an existing AI/tool environment.

Tell the user the consequence:

```text
이건 단순 홈페이지보다 웹앱에 가깝습니다. 사용자가 입력하고 결과를 받아야 하기 때문입니다.
```

### 3. Define The First Useful Version

The first version should answer:

- What is the one core user action?
- What is the one core result?
- What data is needed?
- Can fake/sample data prove the workflow first?
- What would be dangerous to add too early?

Use:

```text
첫 버전은 이것만 되면 됩니다:
1.
2.
3.

이번 버전에서 하지 않을 것:
-
```

### 4. Ask Few Questions

Ask at most 1-3 questions only when the answer changes implementation.

Good questions:

- "누가 이걸 쓰나요?"
- "결과는 화면에서 보면 되나요, 파일로 받아야 하나요?"
- "로그인 없이 먼저 써봐도 되나요?"

Avoid interrogating the user with a long product questionnaire.

If unsure, make safe assumptions and label them.

### 5. Protect The User From Premature Complexity

Usually avoid in v0:

- Authentication.
- Payment.
- Multi-tenant admin systems.
- Complex database schema.
- Background jobs.
- External sending.
- Production deployment.
- Sensitive personal data storage.

Add them only when the user's goal requires them.

### 6. Keep Momentum

Non-developers often quit when the process becomes abstract.

Prefer:

- Show a working screen quickly.
- Use sample data first.
- Verify the main workflow.
- Then add persistence, auth, integrations, and deployment.

Do not make the user wait through long architecture talk unless risk demands it.

## Output Shape

```text
제가 이해한 목표:
가장 적합한 형태:
첫 버전에서 만들 것:
이번에는 하지 않을 것:
중요한 위험:
제가 안전하게 가정할 것:
다음 작업:
```
