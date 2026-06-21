# Agents

The **Agents** page (admin console, *Global agents*) manages the delegatable
sub-agent *types* that are available to every user. These are named personas the
main chat agent can hand sub-tasks to — for example a research agent, a coding
agent, or a reviewer. The main agent decides when to delegate based on each
agent's *When to use* text.

Agents come in two groups: **built-in** agents (defined in code) and **custom**
agents (authored here by an admin). Both are shown as cards; a disabled card is
dimmed.

## Built-in agents

Built-in agents have hard-coded behavior. Their persona, capabilities, and
surface gating are defined in code, so on this page they are **read-only** — the
only control is the **on/off toggle**. Each card shows the name, a `Built-in`
badge, the description, any required-capability chips, the bound surface (if
any), and a *View prompt* expander that reveals the code-defined system prompt.

!!! note "Built-ins can't be deleted"
    There is no delete action on a built-in card. To remove one from delegation,
    disable it with the toggle.

## Custom agents

Custom agents are fully editable. Use **Add agent** (top right, or the button in
the empty state) to create one, and the edit/delete icons on a card to manage it.
Each card shows the name, the auto-generated `slug` badge, the description, and
capability/surface chips. The toggle enables or disables the agent.

### Fields

| Field | Description |
| --- | --- |
| `Name` | Display name. The `slug` is derived from it automatically; names must be unique among global agents. |
| `When to use` (`description`) | Tells the main agent *when* it should delegate to this agent. |
| `Persona / instructions` (`instructions`) | The agent's system prompt. |
| `Only in surface` (`requires_surface`) | Binds the agent to a single surface (chosen from the *mode* surfaces). Leave as **Any surface** to allow delegation anywhere. |
| `Required capabilities` (`required_tools`) | Multi-select of `Web`, `Devices`, `Documents`, `Memory`, `Coding`, `Workspace`. The agent is only delegatable when **all** selected capabilities are available in the run. |
| `Enabled` | Whether the agent is available for delegation. |

!!! note "No model picker"
    You don't pin a model on an agent. The sub-agent resolves its own model at
    delegation time (the same governance/tier rules as any run), and it is gated
    by that model's tags — not the parent's.

## Actions

| Action | Effect |
| --- | --- |
| **Add agent** | Opens the create dialog. Save is blocked until `Name` is set. |
| **Edit** (pencil) | Opens the same dialog pre-filled; saving updates the agent. |
| **Delete** (trash) | Asks for confirmation, then removes the custom agent. |
| **Toggle** | Enables/disables the agent immediately, without opening the dialog. |

Changing a name re-derives the `slug`; a duplicate name is rejected. A failed
save surfaces an error notification and leaves the dialog open.

!!! note "Integration-contributed agents"
    Agents projected from an installed integration also appear in the global
    catalog, but only their **enabled** state can be changed here — every other
    field is read-only, since a reconfigure of the integration would overwrite
    edits.
