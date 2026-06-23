# Agents

The **Agents** page (admin console, *Global agents*) manages the delegatable
sub-agent *types* that are available to every user. These are named personas the
main chat agent can hand sub-tasks to: for example a research agent, a coding
agent, or a reviewer. The main agent decides when to delegate based on each
agent's *When to use* text.

Agents come in two groups: **built-in** agents (defined in code) and **custom**
agents (authored here by an admin). Both are shown as cards; a disabled card is
dimmed.

## Built-in agents

Built-in agents have hard-coded behavior. Their persona, capabilities, and
surface gating are defined in code, so on this page only the **on/off toggle**
and a **Default model** override are editable. Each card shows the name, a
`Built-in` badge, the description, any required-capability chips, the bound
surface (if any), a *View prompt* expander that reveals the code-defined system
prompt, and a *Default model* picker.

The shipped built-in is **Code Reviewer** (`code-reviewer`, gated on the
`Coding` capability). The generic delegation presets `Explore` and `Generic`
(slugs `explore` / `delegate`) also appear as built-in rows: disabling one
removes the corresponding `explore` / generic-delegate tool from runs.

!!! note "Built-ins can't be deleted"
    There is no delete action on a built-in card. To remove one from delegation,
    disable it with the toggle. The only edits a built-in (or
    integration-contributed) agent accepts are `enabled` and `model`; any other
    field change is rejected.

## Custom agents

Custom agents are fully editable. Use **Add agent** (top right, or the button in
the empty state) to create one, and the edit/delete icons on a card to manage it.
Each card shows the name, the auto-generated `slug` badge, the description, and
capability/surface chips plus a model chip when a default model is pinned. The
toggle enables or disables the agent.

### Fields

| Field | Description |
| --- | --- |
| `Name` | Display name. The `slug` is derived from it automatically; names must be unique among global agents. |
| `When to use` (`description`) | Tells the main agent *when* it should delegate to this agent. |
| `Persona / instructions` (`instructions`) | The agent's system prompt. |
| `Only in surface` (`requires_surface`) | Binds the agent to a single surface (chosen from the *mode* surfaces). Leave as **Any surface** to allow delegation anywhere. |
| `Required capabilities` (`required_tools`) | Multi-select of `Web`, `Devices`, `Documents`, `Memory`, `Coding`, `Workspace`. The agent is only delegatable when **all** selected capabilities are available in the run. |
| `Default model` (`model`) | Optional default model for the sub-agent. **Inherit (chat / Auto)** (empty) keeps today's behavior: the worker uses the parent run's model. **Auto (re-resolve)** always picks Auto for the worker, or pick a concrete `provider:model` to pin it. |
| `Enabled` | Whether the agent is available for delegation. |

!!! note "How the default model is applied"
    The default model is only applied when the chat is on Auto; an explicit chat
    model always wins, and a per-task model request still overrides it. A pinned
    model is **not** a bypass: it still passes the chat's data-classification and
    trust-tier gate, so an uncleared pin is rerouted to a governance-compatible
    model rather than leaking. The sub-agent is gated by the model that actually
    runs, not the parent's.

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
    catalog, but only their **enabled** state and **Default model** can be
    changed here - every other field is read-only, since a reconfigure of the
    integration would overwrite edits. Such rows are created on integration setup
    and removed when the config entry is deleted.
