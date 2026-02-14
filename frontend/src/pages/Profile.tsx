export default function Profile() {
  return (
    <div>
      <h1>Profile</h1>

      <form>
        <label>
          Diet preferences:
          <input type="text" placeholder="e.g. vegetarian" />
        </label>

        <br />

        <label>
          Allergies:
          <input type="text" placeholder="e.g. peanuts" />
        </label>

        <br />

        <button type="submit">Save</button>
      </form>
    </div>
  )
}

