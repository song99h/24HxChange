import React from "react";
import ProductCard from "./ProductCard";

const ProductList = ({ savedItems, setSavedItems }) => {

  const products = [
    {
      id: 1,
      title: "Headphones",
      price: 999,
      image: "https://th.bing.com/th/id/OIP.S6HRuRHo8BshQQsHNYfnhAHaE8?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"
    },
    {
      id: 2,
      title: "Watch",
      price: 1999,
      image: "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg"
    },
    {
      id: 3,
      title: "Shoes",
      price: 1499,
      image: "https://i.ebayimg.com/images/g/eRUAAOSwFsJhsW2q/s-l1200.webp"
    },
    {
      id: 4,
      title: "Mobile",
      price: 9999,
      image: "https://th.bing.com/th/id/OIP.fByNXF_1Mmj4DQs3S_8oqwHaEK"
    },
    {
      id: 5,
      title: "Clock",
      price: 999,
      image: "https://antiquevintageclock.com/wp-content/uploads/2019/07/rs-time-and-strike-sides-work-perfectly.jpg"
    },
    {
      id: 6,
      title: "Maruti Suzuki Gypsy",
      price: 655000,
      image: "https://imgd.aeplcdn.com/664x374/ec/26/0E/17998/img/m/Maruti-Suzuki-Gypsy-Right-Front-Three-Quarter-48817_ol.jpg"
    }
  ];

  return (
    <div className="p-6 flex gap-4 flex-wrap justify-center">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          savedItems={savedItems}
          setSavedItems={setSavedItems}
        />
      ))}
    </div>
  );
};

export default ProductList;