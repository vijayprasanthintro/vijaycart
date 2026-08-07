import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer (){
    return (
        <motion.footer
            className="site-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col footer-brand-col">
                        <Link to="/" className="footer-brand">
                            <i className="fa fa-shopping-bag footer-brand-icon" aria-hidden="true"></i>
                            <span>Vijay<span className="text-gold">Cart</span></span>
                        </Link>
                        <p className="footer-tagline">Smart Shopping. Better Choices.</p>
                        <p className="footer-about">
                            VijayCart is your premium destination for mobiles, laptops, fashion,
                            electronics and more - with unbeatable prices, fast delivery and a
                            smooth shopping experience.
                        </p>
                        <div className="footer-social">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fa fa-facebook"></i></a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa fa-instagram"></i></a>
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><i className="fa fa-twitter"></i></a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><i className="fa fa-youtube-play"></i></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h5 className="footer-heading">Support</h5>
                        <ul className="footer-links">
                          
                            <li><span>help@vijaycart.com</span></li>
                            <li><span>+91 8220477466</span></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="mb-0">
                        &copy; 2026 <span className="text-gold fw-bold">VijayCart</span>. All Rights Reserved.
                    </p>
                    <p className="mb-0 footer-bottom-note">
                        <i className="fa fa-lock" aria-hidden="true"></i> Secure payments
                        &nbsp;&bull;&nbsp; Free delivery on orders above ₹499
                    </p>
                </div>
            </div>
        </motion.footer>
    )
}
