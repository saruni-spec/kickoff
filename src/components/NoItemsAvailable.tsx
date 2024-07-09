const NoItemsAvailable = (day: string) => {
  return (
    <div className="noItemsAvailable">
      <p>No games available {day}</p>
    </div>
  );
};

export default NoItemsAvailable;
