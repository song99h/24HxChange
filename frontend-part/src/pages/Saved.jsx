import React from "react";
import { useNavigate } from "react-router-dom";

const Saved = ({ savedItems = [], setSavedItems }) => {
  const navigate = useNavigate();

  const handleRemove = (title) => {
    setSavedItems((prev) =>
      prev.filter((item) => item.title !== title)
    );
  };

  // ✅ Format saved time
  const formatSavedTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-6 bg-[url('Main-display.jpeg')] bg-no-repeat bg-cover">

      <h1 className="text-3xl text-amber-100 font-bold mb-8 text-center">
        Saved Items ❤️
      </h1>

      {savedItems.length === 0 ? (
        <p className="text-center text-white text-lg">
          No saved items yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center">
          {savedItems.map((item, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl p-4 w-72
              shadow-md hover:shadow-2xl 
              hover:-translate-y-2 hover:scale-105 
              transition-all duration-300 cursor-pointer"
            >

              {/* Image */}
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-44 object-cover rounded-lg
                  transition-transform duration-300 group-hover:scale-110"
                />

                {/* View Details Overlay */}
                <div className="absolute inset-0 bg-black/40 
                opacity-0 group-hover:opacity-100 
                flex items-center justify-center 
                transition duration-300 rounded-lg">

                  <button
                    onClick={() =>
                      navigate(`/product/${item.title}`, {
                        state: item,
                      })
                    }
                    className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    View Details 👁
                  </button>
                </div>
              </div>

              <h2 className="font-semibold mt-3 text-lg">
                {item.title}
              </h2>

              <p className="text-green-600 font-bold text-xl">
                ₹{item.price}
              </p>

              <p className="text-gray-500 text-sm">
                📍 Chandigarh, India
              </p>

              {/* ✅ Show Saved Time */}
              <p className="text-gray-400 text-xs">
                🕒 Saved on {formatSavedTime(item.savedAt)}
              </p>

              <button
                onClick={() => handleRemove(item.title)}
                className="w-full mt-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Remove ❌
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;